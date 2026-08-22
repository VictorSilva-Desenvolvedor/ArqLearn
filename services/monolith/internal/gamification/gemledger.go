// Livro-razão de gemas (TDD §16) — item #1 do checklist técnico do documento de moeda virtual:
// antes desta mudança, user_gamification.gems era só um saldo corrente, sem nenhum histórico
// auditável (nem de compra, conquista, baú ou recompensa de bug report). RecordGemTransaction não
// decide saldo nem valida nada — só registra o que quem chama já decidiu e já gravou em `gems`.
package gamification

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
)

// GemTransactionReason identifica a origem de uma movimentação de gemas — precisa bater com a
// CHECK constraint de gem_transactions.reason (migrations/0023).
type GemTransactionReason string

const (
	GemReasonAchievement     GemTransactionReason = "achievement"
	GemReasonDailyChest      GemTransactionReason = "daily_chest"
	GemReasonWeeklyChest     GemTransactionReason = "weekly_chest"
	GemReasonShopPurchase    GemTransactionReason = "shop_purchase"
	GemReasonBugReportReward GemTransactionReason = "bug_report_reward"
	GemReasonGemCoupon       GemTransactionReason = "gem_coupon"
	GemReasonBetStake        GemTransactionReason = "bet_stake"
	GemReasonBetPayout       GemTransactionReason = "bet_payout"
)

// gemLedgerExecer é satisfeito tanto por *pgxpool.Pool quanto por pgx.Tx — permite chamar
// RecordGemTransaction de dentro de uma transação já aberta (handleShopPurchase,
// handleOpenDailyChest, handleOpenWeeklyChest) sem precisar de uma segunda conexão, e também
// direto do pool nos pontos que não abrem transação própria (AwardGems, EvaluateAndUnlock).
type gemLedgerExecer interface {
	Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error)
}

// RecordGemTransaction grava uma linha no livro-razão. delta positivo = crédito, negativo =
// débito; balanceAfter é o saldo já resultante (quem chama já fez o UPDATE gems e sabe o valor —
// esta função nunca recalcula, só registra). referenceID é opcional (ex.: achievement type,
// shop_items.id, gem_bets.id) — string livre pra rastreabilidade humana, sem FK porque aponta pra
// tabelas diferentes dependendo de reason.
//
// Best-effort, mesmo padrão já estabelecido pra RecordEvent (events.go)/EvaluateAndUnlock: falhar
// aqui não deve derrubar uma ação que já concedeu/debitou gemas de verdade. Devolve o erro pra quem
// chama decidir (logar, na maioria dos casos) em vez de engolir silenciosamente — mantém o
// comportamento visível pra quem chama, diferente de RecordEvent que já loga internamente.
func RecordGemTransaction(ctx context.Context, db gemLedgerExecer, userID string, delta int, reason GemTransactionReason, referenceID string, balanceAfter int) error {
	var referenceIDParam any
	if referenceID != "" {
		referenceIDParam = referenceID
	}
	_, err := db.Exec(ctx, `
		INSERT INTO gem_transactions (user_id, delta, reason, reference_id, balance_after)
		VALUES ($1, $2, $3, $4, $5)
	`, userID, delta, string(reason), referenceIDParam, balanceAfter)
	return err
}

// --- GET /v1/gamification/gem-transactions (extrato) ---

// gemTransactionsCursor é o mesmo esquema de paginação já documentado na API Specification §2.4 e
// usado por GET /v1/tracks (internal/learning/learning.go) — cursor é base64 de {"offset": N}.
// Reimplementado aqui (não exportado de internal/learning) porque são pacotes irmãos, nenhum
// depende do outro.
type gemTransactionsCursor struct {
	Offset int `json:"offset"`
}

func encodeGemTransactionsCursor(c gemTransactionsCursor) string {
	b, _ := json.Marshal(c)
	return base64.StdEncoding.EncodeToString(b)
}

func decodeGemTransactionsCursor(s string) (gemTransactionsCursor, error) {
	var c gemTransactionsCursor
	b, err := base64.StdEncoding.DecodeString(s)
	if err != nil {
		return c, err
	}
	err = json.Unmarshal(b, &c)
	return c, err
}

const gemTransactionsPageSize = 20

type gemTransactionJSON struct {
	ID           string    `json:"id"`
	Delta        int       `json:"delta"`
	Reason       string    `json:"reason"`
	ReferenceID  *string   `json:"reference_id"`
	BalanceAfter int       `json:"balance_after"`
	CreatedAt    time.Time `json:"created_at"`
}

// handleGetGemTransactions implementa GET /v1/gamification/gem-transactions — o extrato (TDD
// §16): lista cronológica simples (mais recente primeiro), sem agregação nem gráfico, priorizando
// clareza sobre estética (princípio explícito do documento de moeda virtual — "estética cede
// espaço à transparência"). Só leitura do livro-razão, nunca recalcula saldo.
func handleGetGemTransactions(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		offset := 0
		if raw := r.URL.Query().Get("cursor"); raw != "" {
			if decoded, err := decodeGemTransactionsCursor(raw); err == nil {
				offset = decoded.Offset
			}
		}
		limit := gemTransactionsPageSize
		if raw := r.URL.Query().Get("limit"); raw != "" {
			if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 && parsed <= 100 {
				limit = parsed
			}
		}

		rows, err := pool.Query(r.Context(), `
			SELECT id, delta, reason, reference_id, balance_after, created_at
			FROM gem_transactions
			WHERE user_id = $1
			ORDER BY created_at DESC, id DESC
			LIMIT $2 OFFSET $3
		`, userID, limit+1, offset)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar extrato.")
			return
		}
		defer rows.Close()

		transactions := []gemTransactionJSON{}
		for rows.Next() {
			var t gemTransactionJSON
			if err := rows.Scan(&t.ID, &t.Delta, &t.Reason, &t.ReferenceID, &t.BalanceAfter, &t.CreatedAt); err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler extrato.")
				return
			}
			transactions = append(transactions, t)
		}
		if err := rows.Err(); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler extrato.")
			return
		}

		var nextCursor *string
		if len(transactions) > limit {
			transactions = transactions[:limit]
			nc := encodeGemTransactionsCursor(gemTransactionsCursor{Offset: offset + limit})
			nextCursor = &nc
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"data":        transactions,
			"next_cursor": nextCursor,
		})
	}
}
