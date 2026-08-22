// Double or Nothing (TDD §16) — aposta gemas, compromete-se a manter o streak por N dias
// (`GemBetDaysRequired`, fixo em 7 — simplificação deliberada do parâmetro genérico do
// pseudocódigo original, mesmo espírito de "Regular" ser o preset central da Meta Diária, TDD
// §13), dobra ou perde. Resolvida nos mesmos pontos onde o streak já é lido/expirado hoje
// (internal/learning/answers.go, internal/learning/infinitemode.go e LoadStreakWithExpiration
// abaixo neste pacote) — não introduz um sinal novo, só observa o que o streak já decide.
package gamification

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
)

// GemBetDaysRequired é o número de dias fixo da aposta — 7, igual ao Double or Nothing real.
const GemBetDaysRequired = 7

// GemBetMinStake é o mínimo de gemas apostáveis (evita aposta trivial sem risco real).
const GemBetMinStake = 50

type GemBetStatus string

const (
	GemBetActive GemBetStatus = "active"
	GemBetWon    GemBetStatus = "won"
	GemBetLost   GemBetStatus = "lost"
)

// ResolveBetProgress é a única regra de negócio real desta feature — pura e testada
// (gembets_test.go). streakAdvanced: o streak avançou nesta requisição (um dia novo contabilizado
// — AtualizarStreak é idempotente por dia, então nunca conta o mesmo dia duas vezes).
// streakReset: a streak acabou de expirar (perdeu a sequência). Os dois nunca vêm true juntos na
// prática (são ramos mutuamente exclusivos da mesma requisição), mas streakReset tem prioridade
// se algum dia vierem — perder a sequência sempre encerra a aposta, não há "avanço" que salve.
func ResolveBetProgress(daysCompleted, daysRequired int, streakAdvanced, streakReset bool) (newDaysCompleted int, newStatus GemBetStatus) {
	if streakReset {
		return daysCompleted, GemBetLost
	}
	if streakAdvanced {
		daysCompleted++
		if daysCompleted >= daysRequired {
			return daysCompleted, GemBetWon
		}
	}
	return daysCompleted, GemBetActive
}

// ResolveActiveBet aplica ResolveBetProgress à aposta ativa do usuário, se houver, e persiste o
// resultado — paga stake*2 (RecordGemTransaction, GemReasonBetPayout) se ganhou, não faz nada com
// gemas se perdeu (a aposta já foi debitada no início, sem estorno, mesma regra do pseudocódigo
// original). Best-effort, mesmo padrão de AddWeeklyXP/EvaluateAndUnlock: chamada não deve
// bloquear a resposta que a disparou — streak/XP/vidas já foram gravados de verdade antes desta
// chamada rodar. Sem-op silencioso quando não há aposta ativa (caminho mais comum).
func ResolveActiveBet(ctx context.Context, pool *pgxpool.Pool, userID string, streakAdvanced, streakReset bool) error {
	if !streakAdvanced && !streakReset {
		return nil
	}

	var betID string
	var daysCompleted, stakeGems int
	err := pool.QueryRow(ctx,
		`SELECT id, days_completed, stake_gems FROM gem_bets WHERE user_id = $1 AND status = 'active'`, userID,
	).Scan(&betID, &daysCompleted, &stakeGems)
	if err == pgx.ErrNoRows {
		return nil
	}
	if err != nil {
		return err
	}

	newDaysCompleted, newStatus := ResolveBetProgress(daysCompleted, GemBetDaysRequired, streakAdvanced, streakReset)

	if newStatus == GemBetWon {
		tx, err := pool.Begin(ctx)
		if err != nil {
			return err
		}
		defer func() { _ = tx.Rollback(ctx) }()

		payout := stakeGems * 2
		var newGems int
		if err := tx.QueryRow(ctx,
			`UPDATE user_gamification SET gems = gems + $1 WHERE user_id = $2 RETURNING gems`,
			payout, userID,
		).Scan(&newGems); err != nil {
			return err
		}
		if err := RecordGemTransaction(ctx, tx, userID, payout, GemReasonBetPayout, betID, newGems); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx,
			`UPDATE gem_bets SET status = 'won', days_completed = $1, resolved_at = now() WHERE id = $2`,
			newDaysCompleted, betID,
		); err != nil {
			return err
		}
		return tx.Commit(ctx)
	}

	if newStatus == GemBetLost {
		_, err := pool.Exec(ctx, `UPDATE gem_bets SET status = 'lost', resolved_at = now() WHERE id = $1`, betID)
		return err
	}

	// Ainda 'active', só o contador de dias avançou.
	_, err = pool.Exec(ctx, `UPDATE gem_bets SET days_completed = $1 WHERE id = $2`, newDaysCompleted, betID)
	return err
}

// --- POST /v1/gamification/bets ---

type startGemBetRequest struct {
	StakeGems int `json:"stake_gems"`
}

type gemBetJSON struct {
	StakeGems     int    `json:"stake_gems"`
	DaysRequired  int    `json:"days_required"`
	DaysCompleted int    `json:"days_completed"`
	Status        string `json:"status"`
}

func handleStartGemBet(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var req startGemBetRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.StakeGems < GemBetMinStake {
			apierror.Write(w, http.StatusBadRequest, "INVALID_BODY", "stake_gems deve ser pelo menos 50.")
			return
		}

		var hasActive bool
		if err := pool.QueryRow(r.Context(),
			`SELECT EXISTS(SELECT 1 FROM gem_bets WHERE user_id = $1 AND status = 'active')`, userID,
		).Scan(&hasActive); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar apostas.")
			return
		}
		if hasActive {
			apierror.Write(w, http.StatusConflict, "BET_ALREADY_ACTIVE", "Você já tem uma aposta em andamento.")
			return
		}

		tx, err := pool.Begin(r.Context())
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao iniciar aposta.")
			return
		}
		defer func() { _ = tx.Rollback(r.Context()) }()

		var newGems int
		err = tx.QueryRow(r.Context(),
			`UPDATE user_gamification SET gems = gems - $1 WHERE user_id = $2 AND gems >= $1 RETURNING gems`,
			req.StakeGems, userID,
		).Scan(&newGems)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusPaymentRequired, "INSUFFICIENT_GEMS", "Gemas insuficientes para esta aposta.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao debitar gemas.")
			return
		}

		betID := uuid.New()
		if _, err := tx.Exec(r.Context(), `
			INSERT INTO gem_bets (id, user_id, stake_gems, days_required) VALUES ($1, $2, $3, $4)
		`, betID, userID, req.StakeGems, GemBetDaysRequired); err != nil {
			// A CHECK/índice único (1 aposta ativa por usuário) protege contra corrida aqui —
			// mesma corrida já coberta pela checagem prévia acima, mais forte porque é no banco.
			apierror.Write(w, http.StatusConflict, "BET_ALREADY_ACTIVE", "Você já tem uma aposta em andamento.")
			return
		}

		if err := RecordGemTransaction(r.Context(), tx, userID, -req.StakeGems, GemReasonBetStake, betID.String(), newGems); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao registrar extrato.")
			return
		}

		if err := tx.Commit(r.Context()); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao concluir aposta.")
			return
		}

		writeJSON(w, http.StatusCreated, gemBetJSON{
			StakeGems: req.StakeGems, DaysRequired: GemBetDaysRequired, DaysCompleted: 0, Status: string(GemBetActive),
		})
	}
}

// --- GET /v1/gamification/bets/active ---

func handleGetActiveGemBet(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var bet gemBetJSON
		err := pool.QueryRow(r.Context(), `
			SELECT stake_gems, days_required, days_completed, status
			FROM gem_bets WHERE user_id = $1 AND status = 'active'
		`, userID).Scan(&bet.StakeGems, &bet.DaysRequired, &bet.DaysCompleted, &bet.Status)
		if err == pgx.ErrNoRows {
			writeJSON(w, http.StatusOK, nil)
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar aposta ativa.")
			return
		}
		writeJSON(w, http.StatusOK, bet)
	}
}
