// Package users cobre o domínio de Usuários (SAD §8.2). A partir da v1.3, cadastro/login/
// OAuth são Supabase Auth chamado direto pelo cliente — este pacote só mantém o perfil de
// domínio (criado via trigger de banco, ver Database Design §3.2) e expõe leitura/edição dele.
package users

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
)

func RegisterRoutes(mux *http.ServeMux, pool *pgxpool.Pool, verifier *authmiddleware.Verifier) {
	mux.Handle("GET /v1/users/me", verifier.Middleware(http.HandlerFunc(handleGetMe(pool))))
	mux.Handle("PATCH /v1/users/me", verifier.Middleware(http.HandlerFunc(apierror.NotImplemented)))
	mux.Handle("DELETE /v1/users/me", verifier.Middleware(http.HandlerFunc(apierror.NotImplemented)))
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
		XPTotal       int  `json:"xp_total"`
		XPToday       int  `json:"xp_today"`
		Level         int  `json:"level"`
		StreakCurrent int  `json:"streak_current"`
		StreakBest    int  `json:"streak_best"`
		HeartsCurrent int  `json:"hearts_current"`
		Gems          int  `json:"gems"`
		LeagueTier    *int `json:"league_tier"`
	} `json:"gamification"`
}

const getMeQuery = `
	SELECT u.id, u.name, u.email, u.role, u.timezone, u.created_at,
	       g.xp_total, g.xp_today, g.level, g.streak_current, g.streak_best,
	       g.hearts_current, g.gems
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
		err := pool.QueryRow(r.Context(), getMeQuery, userID).Scan(
			&resp.User.ID, &resp.User.Name, &resp.User.Email, &resp.User.Role,
			&resp.User.Timezone, &resp.User.CreatedAt,
			&resp.Gamification.XPTotal, &resp.Gamification.XPToday, &resp.Gamification.Level,
			&resp.Gamification.StreakCurrent, &resp.Gamification.StreakBest,
			&resp.Gamification.HeartsCurrent, &resp.Gamification.Gems,
		)
		// TODO: preencher league_tier quando o fechamento semanal de liga existir (TDD §6) —
		// hoje todo usuário fica sem liga atribuída, então league_tier é sempre null.

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

		writeJSON(w, http.StatusOK, resp)
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
