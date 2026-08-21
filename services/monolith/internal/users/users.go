// Package users cobre o domínio de Usuários (SAD §8.2). A partir da v1.3, cadastro/login/
// OAuth são Supabase Auth chamado direto pelo cliente — este pacote só mantém o perfil de
// domínio (criado via trigger de banco, ver Database Design §3.2) e expõe leitura/edição dele.
package users

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
	"arqlearn/monolith/internal/gamification"
	"arqlearn/monolith/internal/learning"
)

func RegisterRoutes(mux *http.ServeMux, pool *pgxpool.Pool, mongoDB *mongo.Database, verifier *authmiddleware.Verifier) {
	mux.Handle("GET /v1/users/me", verifier.Middleware(http.HandlerFunc(handleGetMe(pool))))
	mux.Handle("PATCH /v1/users/me", verifier.Middleware(http.HandlerFunc(handleUpdateMe(pool))))
	mux.Handle("DELETE /v1/users/me", verifier.Middleware(http.HandlerFunc(handleDeleteMe(pool))))
	mux.Handle("GET /v1/users/me/export", verifier.Middleware(http.HandlerFunc(handleExportMe(pool, mongoDB))))
}

// userMeResponse espelha o contrato de GET /v1/users/me (API Spec §5).
type userMeResponse struct {
	User struct {
		ID        string    `json:"id"`
		Name      string    `json:"name"`
		Email     string    `json:"email"`
		Role      string    `json:"role"`
		Timezone  string    `json:"timezone"`
		CreatedAt time.Time `json:"created_at"`
	} `json:"user"`
	Gamification struct {
		XPTotal                int                         `json:"xp_total"`
		XPToday                int                         `json:"xp_today"`
		Level                  int                         `json:"level"`
		StreakCurrent          int                         `json:"streak_current"`
		StreakBest             int                         `json:"streak_best"`
		StreakFreezesAvailable int                         `json:"streak_freezes_available"`
		StreakAtRisk           bool                        `json:"streak_at_risk"`
		HeartsCurrent          int                         `json:"hearts_current"`
		HeartsNextAt           *time.Time                  `json:"hearts_next_at"`
		Gems                   int                         `json:"gems"`
		LeagueTier             *string                     `json:"league_tier"`
		Cosmetics              []gamification.CosmeticJSON `json:"cosmetics"`
		IsVIP                  bool                        `json:"is_vip"`
		VIPExpiresAt           *time.Time                  `json:"vip_expires_at"`
	} `json:"gamification"`
}

const getMeQuery = `
	SELECT u.id, u.name, u.email, u.role, u.timezone, u.created_at,
	       g.xp_total, g.xp_today, g.level, g.gems, g.is_vip, g.vip_expires_at
	FROM users u
	JOIN user_gamification g ON g.user_id = u.id
	WHERE u.id = $1 AND u.deleted_at IS NULL
`

func handleGetMe(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var resp userMeResponse
		var isVipRaw bool
		err := pool.QueryRow(r.Context(), getMeQuery, userID).Scan(
			&resp.User.ID, &resp.User.Name, &resp.User.Email, &resp.User.Role,
			&resp.User.Timezone, &resp.User.CreatedAt,
			&resp.Gamification.XPTotal, &resp.Gamification.XPToday, &resp.Gamification.Level, &resp.Gamification.Gems,
			&isVipRaw, &resp.Gamification.VIPExpiresAt,
		)
		if err == pgx.ErrNoRows {
			// Não deveria acontecer — o trigger on_auth_user_created (Database Design §3.2)
			// cria o perfil no mesmo instante em que o Supabase Auth cria auth.users.
			apierror.Write(w, http.StatusNotFound, "USER_PROFILE_NOT_FOUND", "Perfil de usuário não encontrado.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar perfil.")
			return
		}

		// Consultas à parte (não dá pra colocar no SELECT combinado acima porque podem precisar
		// escrever de volta) — aplicam a regeneração preguiçosa de vidas (TDD §5.4) e a expiração
		// preguiçosa de streak (TDD §5.2/§5.3) antes de devolver o perfil, mesmo tratamento de
		// GET /v1/gamification/me.
		resp.Gamification.HeartsCurrent, resp.Gamification.HeartsNextAt, err =
			gamification.LoadHeartsWithRegen(r.Context(), pool, resp.User.ID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar vidas.")
			return
		}
		streak, err := gamification.LoadStreakWithExpiration(r.Context(), pool, resp.User.ID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar streak.")
			return
		}
		resp.Gamification.StreakCurrent = streak.Current
		resp.Gamification.StreakBest = streak.Best
		resp.Gamification.StreakFreezesAvailable = streak.FreezesAvailable
		resp.Gamification.StreakAtRisk = streak.AtRisk

		resp.Gamification.LeagueTier, err = gamification.LoadLeagueTierName(r.Context(), pool, resp.User.ID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar liga.")
			return
		}

		resp.Gamification.IsVIP = gamification.EhVIPAtivo(isVipRaw, resp.Gamification.VIPExpiresAt, time.Now().UTC())

		resp.Gamification.Cosmetics, err = gamification.LoadOwnedCosmetics(r.Context(), pool, resp.User.ID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar cosméticos.")
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

// updateMeRequest espelha o contrato de PATCH /v1/users/me (API Spec §5) — todos os campos são
// opcionais, ponteiro pra distinguir "não mandou" de "mandou vazio".
type updateMeRequest struct {
	Name                 *string `json:"name"`
	Timezone             *string `json:"timezone"`
	NotificationsEnabled *bool   `json:"notifications_enabled"`
}

// meUserResponse espelha o objeto User canônico (API Spec §3.1) — PATCH devolve só isso, sem o
// bloco de gamification (diferente de GET /v1/users/me).
type meUserResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	Timezone  string    `json:"timezone"`
	CreatedAt time.Time `json:"created_at"`
}

func handleUpdateMe(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var req updateMeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			apierror.Write(w, http.StatusBadRequest, "INVALID_BODY", "Corpo da requisição inválido.")
			return
		}

		sets := make([]string, 0, 3)
		args := make([]any, 0, 4)
		if req.Name != nil {
			args = append(args, *req.Name)
			sets = append(sets, fmt.Sprintf("name = $%d", len(args)))
		}
		if req.Timezone != nil {
			args = append(args, *req.Timezone)
			sets = append(sets, fmt.Sprintf("timezone = $%d", len(args)))
		}
		if req.NotificationsEnabled != nil {
			args = append(args, *req.NotificationsEnabled)
			sets = append(sets, fmt.Sprintf("notifications_enabled = $%d", len(args)))
		}
		if len(sets) == 0 {
			apierror.Write(w, http.StatusBadRequest, "INVALID_BODY", "Nenhum campo pra atualizar.")
			return
		}
		args = append(args, userID)

		query := fmt.Sprintf(
			"UPDATE users SET %s WHERE id = $%d AND deleted_at IS NULL RETURNING id, name, email, role, timezone, created_at",
			strings.Join(sets, ", "), len(args),
		)

		var resp meUserResponse
		err := pool.QueryRow(r.Context(), query, args...).Scan(
			&resp.ID, &resp.Name, &resp.Email, &resp.Role, &resp.Timezone, &resp.CreatedAt,
		)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusNotFound, "USER_PROFILE_NOT_FOUND", "Perfil de usuário não encontrado.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar perfil.")
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

const lgpdDeletionGraceDays = 30

type deleteMeResponse struct {
	DeletionScheduledAt time.Time `json:"deletion_scheduled_at"`
}

// handleDeleteMe implementa a exclusão de conta da API Spec §5 (LGPD): soft-delete imediato
// (deleted_at = now(), já é o que GET /v1/users/me filtra) — a conta para de responder na hora,
// mas os dados só são de fato anonimizados/expurgados depois do prazo de graça (30 dias), por um
// job que ainda não existe (mesmo padrão de "sem consumidor de fila real ainda", ver
// Docs/CLAUDE.md sobre cmd/worker). deletion_scheduled_at aqui é só informativo pro cliente — não
// fica gravado em lugar nenhum, é calculado a partir de agora a cada chamada.
func handleDeleteMe(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		now := time.Now().UTC()
		tag, err := pool.Exec(r.Context(),
			"UPDATE users SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL", now, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao solicitar exclusão de conta.")
			return
		}
		if tag.RowsAffected() == 0 {
			apierror.Write(w, http.StatusNotFound, "USER_PROFILE_NOT_FOUND", "Perfil de usuário não encontrado.")
			return
		}

		writeJSON(w, http.StatusAccepted, deleteMeResponse{
			DeletionScheduledAt: now.AddDate(0, 0, lgpdDeletionGraceDays),
		})
	}
}

// exportResponse é o payload de GET /v1/users/me/export — portabilidade de dados (LGPD, direito
// de acesso/portabilidade): reúne num único JSON tudo que este serviço guarda sobre o usuário.
// Não inclui e-mail/senha de autenticação (isso é do Supabase Auth, nunca passa por aqui, ver
// Docs/CLAUDE.md "O que NÃO fazer") nem dados de outros usuários (ex.: nomes de concorrentes de
// liga) — só o que pertence à própria conta.
type exportResponse struct {
	ExportedAt   time.Time                        `json:"exported_at"`
	User         meUserResponse                   `json:"user"`
	Gamification exportGamification               `json:"gamification"`
	Achievements []exportAchievement              `json:"achievements"`
	Progress     learning.ProgressSummaryResponse `json:"progress"`
}

type exportGamification struct {
	XPTotal       int `json:"xp_total"`
	Level         int `json:"level"`
	StreakCurrent int `json:"streak_current"`
	StreakBest    int `json:"streak_best"`
	HeartsCurrent int `json:"hearts_current"`
	Gems          int `json:"gems"`
	CurrentTier   int `json:"current_tier"`
}

type exportAchievement struct {
	Type       string    `json:"type"`
	UnlockedAt time.Time `json:"unlocked_at"`
}

func handleExportMe(pool *pgxpool.Pool, mongoDB *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var resp exportResponse
		resp.ExportedAt = time.Now().UTC()

		err := pool.QueryRow(r.Context(), `
			SELECT u.id, u.name, u.email, u.role, u.timezone, u.created_at,
			       g.xp_total, g.level, g.streak_current, g.streak_best, g.hearts_current, g.gems, g.current_tier
			FROM users u JOIN user_gamification g ON g.user_id = u.id
			WHERE u.id = $1 AND u.deleted_at IS NULL
		`, userID).Scan(
			&resp.User.ID, &resp.User.Name, &resp.User.Email, &resp.User.Role, &resp.User.Timezone, &resp.User.CreatedAt,
			&resp.Gamification.XPTotal, &resp.Gamification.Level, &resp.Gamification.StreakCurrent,
			&resp.Gamification.StreakBest, &resp.Gamification.HeartsCurrent, &resp.Gamification.Gems,
			&resp.Gamification.CurrentTier,
		)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusNotFound, "USER_PROFILE_NOT_FOUND", "Perfil de usuário não encontrado.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar perfil.")
			return
		}

		rows, err := pool.Query(r.Context(), `SELECT type, unlocked_at FROM achievements WHERE user_id = $1 ORDER BY unlocked_at ASC`, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar conquistas.")
			return
		}
		resp.Achievements = []exportAchievement{}
		for rows.Next() {
			var a exportAchievement
			if err := rows.Scan(&a.Type, &a.UnlockedAt); err != nil {
				rows.Close()
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler conquistas.")
				return
			}
			resp.Achievements = append(resp.Achievements, a)
		}
		rows.Close()

		// Progresso vem do MongoDB — best-effort: sem conexão, o resto do export ainda é útil, só
		// fica sem essa seção (zerada) em vez de falhar a exportação inteira.
		if mongoDB != nil {
			resp.Progress, _ = learning.ComputeProgressSummary(r.Context(), mongoDB, userID)
		}

		w.Header().Set("Content-Disposition", `attachment; filename="arqlearn-meus-dados.json"`)
		writeJSON(w, http.StatusOK, resp)
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
