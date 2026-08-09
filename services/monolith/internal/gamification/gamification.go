// Package gamification cobre o Gamification Service (SAD §8.6 / API Spec §8).
// Regras de negócio (calcularXP, limite diário de XP, streak, ligas) vêm do
// Docs/ArqLearn_TDD_Technical_Design_Document.md — não reimplementar de memória.
package gamification

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
)

func RegisterRoutes(mux *http.ServeMux, pool *pgxpool.Pool, verifier *authmiddleware.Verifier) {
	mux.Handle("GET /v1/gamification/me", verifier.Middleware(http.HandlerFunc(handleGetGamificationMe(pool))))
	mux.Handle("GET /v1/gamification/league", verifier.Middleware(http.HandlerFunc(handleGetLeague(pool))))
	mux.Handle("POST /v1/gamification/streak/freeze", verifier.Middleware(http.HandlerFunc(handleStreakFreeze(pool))))
	mux.Handle("POST /v1/gamification/shop/purchase", verifier.Middleware(http.HandlerFunc(handleShopPurchase(pool))))
}

// --- GET /v1/gamification/me ---

type achievementJSON struct {
	Type       string    `json:"type"`
	UnlockedAt time.Time `json:"unlocked_at"`
}

type gamificationMeResponse struct {
	XPTotal       int               `json:"xp_total"`
	XPToday       int               `json:"xp_today"`
	Level         int               `json:"level"`
	StreakCurrent int               `json:"streak_current"`
	StreakBest    int               `json:"streak_best"`
	HeartsCurrent int               `json:"hearts_current"`
	Gems          int               `json:"gems"`
	LeagueTier    *string           `json:"league_tier"`
	Achievements  []achievementJSON `json:"achievements"`
}

func handleGetGamificationMe(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var resp gamificationMeResponse
		err := pool.QueryRow(r.Context(), `
			SELECT xp_total, xp_today, level, streak_current, streak_best, hearts_current, gems
			FROM user_gamification WHERE user_id = $1
		`, userID).Scan(&resp.XPTotal, &resp.XPToday, &resp.Level, &resp.StreakCurrent,
			&resp.StreakBest, &resp.HeartsCurrent, &resp.Gems)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusNotFound, "USER_PROFILE_NOT_FOUND", "Perfil de usuário não encontrado.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar gamificação.")
			return
		}

		// league_tier só existe se o usuário já tiver sido inserido numa liga (ver
		// ensureLeagueMembership, chamado por GET /league) — ninguém entra numa liga sozinho
		// batendo só neste endpoint, então fica null até a pessoa abrir a tela Liga uma vez.
		var tierNum *int
		_ = pool.QueryRow(r.Context(), `
			SELECT l.tier FROM league_members lm JOIN leagues l ON l.id = lm.league_id
			WHERE lm.user_id = $1 AND l.week_reference = $2
		`, userID, mondayOf(time.Now().UTC())).Scan(&tierNum)
		if tierNum != nil {
			name := tierName(*tierNum)
			resp.LeagueTier = &name
		}

		rows, err := pool.Query(r.Context(), `SELECT type, unlocked_at FROM achievements WHERE user_id = $1 ORDER BY unlocked_at DESC`, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar conquistas.")
			return
		}
		defer rows.Close()
		resp.Achievements = []achievementJSON{}
		for rows.Next() {
			var a achievementJSON
			if err := rows.Scan(&a.Type, &a.UnlockedAt); err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler conquistas.")
				return
			}
			resp.Achievements = append(resp.Achievements, a)
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

// --- GET /v1/gamification/league ---

// defaultLeagueTier: todo mundo entra na liga bronze (1) — fechamento semanal com promoção/
// rebaixamento por posição (TDD §6) ainda não existe (nenhum job roda isso), então esta fase só
// cobre "estar numa liga com XP da semana rastreado", não o ciclo de subir/descer de verdade.
const defaultLeagueTier = 1

var tierNamesByNumber = map[int]string{1: "bronze", 2: "prata", 3: "ouro", 4: "platina", 5: "diamante"}

func tierName(n int) string {
	if name, ok := tierNamesByNumber[n]; ok {
		return name
	}
	return "bronze"
}

// mondayOf normaliza pra meia-noite UTC da segunda-feira da semana de `t` — usado como
// week_reference (mesma semana pra todo mundo, independente de quando cada um entrou).
func mondayOf(t time.Time) time.Time {
	t = t.UTC().Truncate(24 * time.Hour)
	offset := int(t.Weekday()) - int(time.Monday)
	if offset < 0 {
		offset += 7
	}
	return t.AddDate(0, 0, -offset)
}

// ensureLeagueMembership garante que o usuário está numa leagues/league_members desta semana,
// criando os dois (upsert) se ainda não existir — sem isso, "GET /league" não teria nada real pra
// mostrar pra ninguém, já que o fechamento semanal automático (TDD §6) não roda ainda. Todo mundo
// cai no mesmo group_number=1 da tier bronze por enquanto — particionar por grupo de <15 membros
// só faz sentido quando o fechamento/promoção também existir.
func ensureLeagueMembership(ctx context.Context, pool *pgxpool.Pool, userID string) (leagueID uuid.UUID, err error) {
	week := mondayOf(time.Now().UTC())

	err = pool.QueryRow(ctx, `
		INSERT INTO leagues (id, week_reference, tier, group_number)
		VALUES ($1, $2, $3, 1)
		ON CONFLICT (week_reference, tier, group_number) DO UPDATE SET tier = leagues.tier
		RETURNING id
	`, uuid.New(), week, defaultLeagueTier).Scan(&leagueID)
	if err != nil {
		return uuid.Nil, err
	}

	_, err = pool.Exec(ctx, `
		INSERT INTO league_members (league_id, user_id, xp_this_week)
		VALUES ($1, $2, 0)
		ON CONFLICT (league_id, user_id) DO NOTHING
	`, leagueID, userID)
	return leagueID, err
}

// AddWeeklyXP soma xp ao league_members.xp_this_week do usuário na liga da semana atual, criando
// a matrícula se ainda não existir (ensureLeagueMembership). Chamado por
// internal/learning/answers.go depois de conceder XP numa resposta — sem isso, a tela Liga nunca
// sairia de xp_this_week=0 pra ninguém, mesmo com a rota GET /league já sendo real.
func AddWeeklyXP(ctx context.Context, pool *pgxpool.Pool, userID string, xp int) error {
	if xp <= 0 {
		return nil
	}
	leagueID, err := ensureLeagueMembership(ctx, pool, userID)
	if err != nil {
		return err
	}
	_, err = pool.Exec(ctx,
		`UPDATE league_members SET xp_this_week = xp_this_week + $1 WHERE league_id = $2 AND user_id = $3`,
		xp, leagueID, userID)
	return err
}

type leagueRankingEntry struct {
	UserID     string `json:"user_id"`
	Name       string `json:"name"`
	XPThisWeek int    `json:"xp_this_week"`
	Position   int    `json:"position"`
}

type leagueResponse struct {
	LeagueID      string               `json:"league_id"`
	Tier          string               `json:"tier"`
	WeekReference string               `json:"week_reference"`
	Ranking       []leagueRankingEntry `json:"ranking"`
}

func handleGetLeague(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		leagueID, err := ensureLeagueMembership(r.Context(), pool, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao entrar na liga.")
			return
		}

		var resp leagueResponse
		var weekRef time.Time
		var tierNum int
		if err := pool.QueryRow(r.Context(),
			`SELECT id, tier, week_reference FROM leagues WHERE id = $1`, leagueID,
		).Scan(&leagueID, &tierNum, &weekRef); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar liga.")
			return
		}
		resp.LeagueID = leagueID.String()
		resp.Tier = tierName(tierNum)
		resp.WeekReference = weekRef.Format("2006-01-02")

		rows, err := pool.Query(r.Context(), `
			SELECT lm.user_id, u.name, lm.xp_this_week
			FROM league_members lm JOIN users u ON u.id = lm.user_id
			WHERE lm.league_id = $1
			ORDER BY lm.xp_this_week DESC, u.name ASC
		`, leagueID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar ranking.")
			return
		}
		defer rows.Close()
		position := 0
		for rows.Next() {
			position++
			var entry leagueRankingEntry
			if err := rows.Scan(&entry.UserID, &entry.Name, &entry.XPThisWeek); err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler ranking.")
				return
			}
			entry.Position = position
			resp.Ranking = append(resp.Ranking, entry)
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

// --- POST /v1/gamification/streak/freeze ---

type freezeResponse struct {
	StreakFreezesAvailable int `json:"streak_freezes_available"`
}

func handleStreakFreeze(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var remaining int
		err := pool.QueryRow(r.Context(), `
			UPDATE user_gamification
			SET streak_freezes_available = streak_freezes_available - 1
			WHERE user_id = $1 AND streak_freezes_available > 0
			RETURNING streak_freezes_available
		`, userID).Scan(&remaining)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusConflict, "NO_STREAK_FREEZE_AVAILABLE", "Você não tem nenhum bloqueio de ofensiva disponível.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consumir bloqueio de ofensiva.")
			return
		}

		writeJSON(w, http.StatusOK, freezeResponse{StreakFreezesAvailable: remaining})
	}
}

// --- POST /v1/gamification/shop/purchase ---

type purchaseRequest struct {
	ItemID string `json:"item_id"`
}

type purchaseResponse struct {
	GemsRestantes int `json:"gems_restantes"`
	Item          struct {
		ID   string `json:"id"`
		Tipo string `json:"tipo"`
	} `json:"item"`
}

func handleShopPurchase(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}
		idempotencyKey := r.Header.Get("Idempotency-Key")
		if idempotencyKey == "" {
			apierror.Write(w, http.StatusBadRequest, "IDEMPOTENCY_KEY_REQUIRED", "Cabeçalho Idempotency-Key obrigatório.")
			return
		}

		var req purchaseRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ItemID == "" {
			apierror.Write(w, http.StatusBadRequest, "INVALID_BODY", "Corpo da requisição inválido.")
			return
		}

		// Idempotência de verdade: se essa chave já foi usada, devolve o mesmo resultado em vez
		// de tentar cobrar de novo (purchases.idempotency_key é UNIQUE, ver migrations/0001_init).
		var existing purchaseResponse
		var existingGems int
		err := pool.QueryRow(r.Context(), `
			SELECT p.price_paid_gems, si.id, si.category,
			       (SELECT gems FROM user_gamification WHERE user_id = $2)
			FROM purchases p JOIN shop_items si ON si.id = p.item_id
			WHERE p.idempotency_key = $1
		`, idempotencyKey, userID).Scan(new(int), &existing.Item.ID, &existing.Item.Tipo, &existingGems)
		if err == nil {
			existing.GemsRestantes = existingGems
			writeJSON(w, http.StatusOK, existing)
			return
		}
		if err != pgx.ErrNoRows {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao verificar compra.")
			return
		}

		var itemUUID uuid.UUID
		if itemUUID, err = uuid.Parse(req.ItemID); err != nil {
			apierror.Write(w, http.StatusNotFound, "ITEM_NOT_FOUND", "Item não encontrado na loja.")
			return
		}

		var priceGems int
		var category string
		err = pool.QueryRow(r.Context(),
			`SELECT price_gems, category FROM shop_items WHERE id = $1 AND active = true`, itemUUID,
		).Scan(&priceGems, &category)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusNotFound, "ITEM_NOT_FOUND", "Item não encontrado na loja.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar item.")
			return
		}

		tx, err := pool.Begin(r.Context())
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao iniciar compra.")
			return
		}
		defer func() { _ = tx.Rollback(r.Context()) }()

		var gemsRestantes int
		err = tx.QueryRow(r.Context(), `
			UPDATE user_gamification SET gems = gems - $1 WHERE user_id = $2 AND gems >= $1
			RETURNING gems
		`, priceGems, userID).Scan(&gemsRestantes)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusPaymentRequired, "INSUFFICIENT_GEMS", "Gemas insuficientes para esta compra.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao debitar gemas.")
			return
		}

		// Efeito de posse imediata pros itens consumíveis — cosméticos ainda não têm inventário
		// (nenhuma tabela pra "o que o usuário possui" existe além do registro em `purchases`
		// em si, que já serve de comprovante), fora de escopo por ora.
		if category == "streak_freeze" {
			if _, err := tx.Exec(r.Context(),
				`UPDATE user_gamification SET streak_freezes_available = streak_freezes_available + 1 WHERE user_id = $1`,
				userID); err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao aplicar item.")
				return
			}
		}
		if category == "hearts_refill" {
			if _, err := tx.Exec(r.Context(),
				`UPDATE user_gamification SET hearts_current = 5 WHERE user_id = $1`, userID); err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao aplicar item.")
				return
			}
		}

		if _, err := tx.Exec(r.Context(), `
			INSERT INTO purchases (id, user_id, item_id, price_paid_gems, idempotency_key)
			VALUES ($1, $2, $3, $4, $5)
		`, uuid.New(), userID, itemUUID, priceGems, idempotencyKey); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao registrar compra.")
			return
		}

		// Contadores de conquista somados dentro da mesma transação (atômico com o débito de
		// gemas acima) — só avaliados/gravados como achievement depois do commit confirmado.
		counters, err := scanCounters(tx.QueryRow(r.Context(), `
			UPDATE user_gamification SET
				shop_purchases_total = shop_purchases_total + 1,
				gems_spent_total = gems_spent_total + $2
			WHERE user_id = $1
			RETURNING `+counterColumns, userID, priceGems))
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar contadores.")
			return
		}

		if err := tx.Commit(r.Context()); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao concluir compra.")
			return
		}

		// Best-effort, mesmo padrão de AddWeeklyXP — a compra já está confirmada acima.
		if _, err := EvaluateAndUnlock(r.Context(), pool, userID, counters); err != nil {
			log.Printf("aviso: falha ao avaliar conquistas (user_id=%s): %v", userID, err)
		}

		resp := purchaseResponse{GemsRestantes: gemsRestantes}
		resp.Item.ID = itemUUID.String()
		resp.Item.Tipo = category
		writeJSON(w, http.StatusOK, resp)
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
