// VIP "Mestre Arquiteto" (a pedido do usuário) — entitlement de gamificação com dois caminhos de
// ativação: cupom de 10 dígitos gerado por um admin e resgatado pelo usuário (funcional já nesta
// fase), e assinatura recorrente (schema pronto, endpoint desabilitado — ver
// VIPSubscriptionsEnabled). Isolado num arquivo próprio pra não fazer gamification.go (que já
// concentra baú/liga/loja) crescer ainda mais.
package gamification

import (
	cryptorand "crypto/rand"
	"encoding/json"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
)

// VIPSubscriptionsEnabled trava POST /v1/vip/subscribe atrás de um 501 até um gateway de
// pagamento (Stripe/RevenueCat/IAP) ser integrado de verdade — não existe nenhuma integração de
// cobrança no projeto ainda. Vira true só quando esse trabalho futuro acontecer.
const VIPSubscriptionsEnabled = false

// dateOrEmpty formata um *time.Time nullable como "YYYY-MM-DD", ou "" se nil — mesmo formato
// usado por VIPResetsAposReset/QuestoesHojeAposReset (equivalente ao helper de
// internal/learning/answers.go, mas esse pacote não pode importar de lá).
func dateOrEmpty(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format("2006-01-02")
}

// --- GET /v1/vip/status ---

type vipStatusResponse struct {
	IsVIP                 bool       `json:"is_vip"`
	VIPExpiresAt          *time.Time `json:"vip_expires_at"`
	DailyChestResetsUsed  int        `json:"daily_chest_resets_used"`
	DailyChestResetsMax   int        `json:"daily_chest_resets_max"`
	WeeklyChestResetsUsed int        `json:"weekly_chest_resets_used"`
	WeeklyChestResetsMax  int        `json:"weekly_chest_resets_max"`
}

func handleGetVIPStatus(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var isVipRaw bool
		var vipExpiresAt *time.Time
		var timezone string
		var dailyResetsUsed, weeklyResetsUsed int
		var dailyResetsDate, weeklyResetsCycleStart, weeklyCycleStart *time.Time
		err := pool.QueryRow(r.Context(), `
			SELECT u.timezone, g.is_vip, g.vip_expires_at,
			       g.vip_daily_chest_resets_used, g.vip_daily_chest_resets_date,
			       g.vip_weekly_chest_resets_used, g.vip_weekly_chest_resets_cycle_start,
			       g.chest_weekly_cycle_start
			FROM users u JOIN user_gamification g ON g.user_id = u.id
			WHERE u.id = $1
		`, userID).Scan(&timezone, &isVipRaw, &vipExpiresAt,
			&dailyResetsUsed, &dailyResetsDate,
			&weeklyResetsUsed, &weeklyResetsCycleStart, &weeklyCycleStart)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusNotFound, "USER_PROFILE_NOT_FOUND", "Perfil de usuário não encontrado.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar status VIP.")
			return
		}

		now := time.Now().UTC()
		hojeLocal := HojeLocal(timezone, now)
		resp := vipStatusResponse{
			IsVIP:        EhVIPAtivo(isVipRaw, vipExpiresAt, now),
			VIPExpiresAt: vipExpiresAt,
		}
		if resp.IsVIP {
			resp.DailyChestResetsUsed = VIPResetsAposReset(dailyResetsUsed, dateOrEmpty(dailyResetsDate), hojeLocal)
			resp.DailyChestResetsMax = VIPDailyChestResetsMax
			resp.WeeklyChestResetsUsed = VIPResetsAposReset(weeklyResetsUsed, dateOrEmpty(weeklyResetsCycleStart), dateOrEmpty(weeklyCycleStart))
			resp.WeeklyChestResetsMax = VIPWeeklyChestResetsMax
		}
		writeJSON(w, http.StatusOK, resp)
	}
}

// --- POST /v1/gamification/daily-chest/reset ---

// handleResetDailyChest implementa o benefício VIP "resetar o baú diário mais uma vez por dia":
// só limpa chest_claimed_date de hoje, o que já torna o baú disponível de novo na hora, já que
// chest_questions_today nunca é zerado ao abrir (ver LoadDailyChestStatus) — não fabrica um
// sistema de recompensa novo, só reabre a porta que já existe.
func handleResetDailyChest(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var isVipRaw bool
		var vipExpiresAt *time.Time
		var timezone string
		var resetsUsed int
		var resetsDate *time.Time
		if err := pool.QueryRow(r.Context(), `
			SELECT u.timezone, g.is_vip, g.vip_expires_at, g.vip_daily_chest_resets_used, g.vip_daily_chest_resets_date
			FROM users u JOIN user_gamification g ON g.user_id = u.id
			WHERE u.id = $1
		`, userID).Scan(&timezone, &isVipRaw, &vipExpiresAt, &resetsUsed, &resetsDate); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar perfil.")
			return
		}

		now := time.Now().UTC()
		if !EhVIPAtivo(isVipRaw, vipExpiresAt, now) {
			apierror.Write(w, http.StatusForbidden, "VIP_REQUIRED", "Resetar o Baú Diário é um benefício exclusivo VIP.")
			return
		}

		status, err := LoadDailyChestStatus(r.Context(), pool, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar baú diário.")
			return
		}
		if !status.ClaimedToday {
			apierror.Write(w, http.StatusConflict, "CHEST_NOT_CLAIMED_YET", "O Baú Diário de hoje ainda não foi aberto — nada para resetar.")
			return
		}

		hojeLocal := HojeLocal(timezone, now)
		resetsUsadosHoje := VIPResetsAposReset(resetsUsed, dateOrEmpty(resetsDate), hojeLocal)
		if resetsUsadosHoje >= VIPDailyChestResetsMax {
			apierror.Write(w, http.StatusConflict, "CHEST_RESET_LIMIT_REACHED", "Você já usou seu reset de Baú Diário hoje.")
			return
		}

		hojeLocalDate, _ := time.Parse("2006-01-02", hojeLocal)
		if _, err := pool.Exec(r.Context(), `
			UPDATE user_gamification
			SET chest_claimed_date = NULL, vip_daily_chest_resets_used = $1, vip_daily_chest_resets_date = $2
			WHERE user_id = $3
		`, resetsUsadosHoje+1, hojeLocalDate, userID); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao resetar baú diário.")
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"available":          true,
			"resets_used":        resetsUsadosHoje + 1,
			"resets_max":         VIPDailyChestResetsMax,
			"questions_required": status.QuestionsRequired,
		})
	}
}

// --- POST /v1/gamification/weekly-chest/reset ---

// handleResetWeeklyChest é o mesmo benefício do reset diário, aplicado ao Baú Semanal (2x por
// ciclo de 7 dias em vez de 1x por dia) — limpa chest_weekly_claimed_cycle_start do ciclo vigente.
func handleResetWeeklyChest(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var isVipRaw bool
		var vipExpiresAt *time.Time
		var timezone string
		var resetsUsed int
		var resetsCycleStart, chestCycleStart *time.Time
		if err := pool.QueryRow(r.Context(), `
			SELECT u.timezone, g.is_vip, g.vip_expires_at,
			       g.vip_weekly_chest_resets_used, g.vip_weekly_chest_resets_cycle_start, g.chest_weekly_cycle_start
			FROM users u JOIN user_gamification g ON g.user_id = u.id
			WHERE u.id = $1
		`, userID).Scan(&timezone, &isVipRaw, &vipExpiresAt, &resetsUsed, &resetsCycleStart, &chestCycleStart); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar perfil.")
			return
		}

		now := time.Now().UTC()
		if !EhVIPAtivo(isVipRaw, vipExpiresAt, now) {
			apierror.Write(w, http.StatusForbidden, "VIP_REQUIRED", "Resetar o Baú Semanal é um benefício exclusivo VIP.")
			return
		}

		status, err := LoadWeeklyChestStatus(r.Context(), pool, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar baú semanal.")
			return
		}
		if !status.ClaimedThisCycle {
			apierror.Write(w, http.StatusConflict, "CHEST_NOT_CLAIMED_YET", "O Baú Semanal deste ciclo ainda não foi aberto — nada para resetar.")
			return
		}

		// LoadWeeklyChestStatus acima já pode ter avançado o ciclo (reset preguiçoso) — relê
		// chest_weekly_cycle_start pra comparar contra o período certo do contador de resets.
		var cicloVigente *time.Time
		if err := pool.QueryRow(r.Context(), `SELECT chest_weekly_cycle_start FROM user_gamification WHERE user_id = $1`, userID).Scan(&cicloVigente); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar ciclo semanal.")
			return
		}

		resetsUsadosNoCiclo := VIPResetsAposReset(resetsUsed, dateOrEmpty(resetsCycleStart), dateOrEmpty(cicloVigente))
		if resetsUsadosNoCiclo >= VIPWeeklyChestResetsMax {
			apierror.Write(w, http.StatusConflict, "CHEST_RESET_LIMIT_REACHED", "Você já usou seus 2 resets de Baú Semanal neste ciclo.")
			return
		}

		if _, err := pool.Exec(r.Context(), `
			UPDATE user_gamification
			SET chest_weekly_claimed_cycle_start = NULL, vip_weekly_chest_resets_used = $1, vip_weekly_chest_resets_cycle_start = $2
			WHERE user_id = $3
		`, resetsUsadosNoCiclo+1, cicloVigente, userID); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao resetar baú semanal.")
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"available":          true,
			"resets_used":        resetsUsadosNoCiclo + 1,
			"resets_max":         VIPWeeklyChestResetsMax,
			"questions_required": status.QuestionsRequired,
		})
	}
}

// --- POST /v1/vip/coupons (admin) ---

type createCouponRequest struct {
	DurationDays int `json:"duration_days"`
}

type createCouponResponse struct {
	Code         string `json:"code"`
	DurationDays int    `json:"duration_days"`
}

// gerarCodigoCupom sorteia 10 dígitos numéricos com crypto/rand (não math/rand — diferente do
// sorteio de recompensa de baú, aqui um código previsível vira VIP de graça pra quem adivinhar).
func gerarCodigoCupom() (string, error) {
	const max = 10_000_000_000 // 10^10 — espaço de 10 dígitos
	n, err := cryptorand.Int(cryptorand.Reader, big.NewInt(max))
	if err != nil {
		return "", err
	}
	return leftPadZeros(n.Int64(), 10), nil
}

func leftPadZeros(n int64, width int) string {
	s := ""
	for i := 0; i < width; i++ {
		s = string(rune('0'+n%10)) + s
		n /= 10
	}
	return s
}

// handleCreateVIPCoupon exige role=admin (checado direto na tabela users — não há middleware de
// papel no projeto ainda, e criar um só pra este endpoint seria over-engineering). Sem painel
// admin nesta fase: o usuário chama esta rota direto (curl/Postman, documentado na API Spec) e
// entrega o código manualmente.
func handleCreateVIPCoupon(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var role string
		if err := pool.QueryRow(r.Context(), `SELECT role FROM users WHERE id = $1`, userID).Scan(&role); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar usuário.")
			return
		}
		if role != "admin" {
			apierror.Write(w, http.StatusForbidden, "ADMIN_REQUIRED", "Só administradores podem gerar cupons VIP.")
			return
		}

		var req createCouponRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.DurationDays <= 0 {
			apierror.Write(w, http.StatusBadRequest, "INVALID_BODY", "duration_days deve ser um inteiro positivo.")
			return
		}

		// Colisão de código é extremamente improvável (espaço de 10^10), mas o UNIQUE da coluna
		// está lá — algumas tentativas curtas em vez de assumir que nunca vai colidir.
		const maxTentativas = 5
		for i := 0; i < maxTentativas; i++ {
			code, err := gerarCodigoCupom()
			if err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao gerar código do cupom.")
				return
			}
			_, err = pool.Exec(r.Context(), `
				INSERT INTO vip_coupons (id, code, duration_days, created_by) VALUES ($1, $2, $3, $4)
			`, uuid.New(), code, req.DurationDays, userID)
			if err == nil {
				writeJSON(w, http.StatusCreated, createCouponResponse{Code: code, DurationDays: req.DurationDays})
				return
			}
			if !isUniqueViolation(err) {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao criar cupom.")
				return
			}
		}
		apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao gerar um código de cupom único.")
	}
}

func isUniqueViolation(err error) bool {
	return strings.Contains(err.Error(), "duplicate key value violates unique constraint")
}

// --- POST /v1/vip/coupons/redeem ---

type redeemCouponRequest struct {
	Code string `json:"code"`
}

type redeemCouponResponse struct {
	IsVIP        bool       `json:"is_vip"`
	VIPExpiresAt *time.Time `json:"vip_expires_at"`
}

func handleRedeemVIPCoupon(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var req redeemCouponRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Code) == "" {
			apierror.Write(w, http.StatusBadRequest, "INVALID_BODY", "Informe o código do cupom.")
			return
		}
		code := strings.TrimSpace(req.Code)

		var durationDays int
		err := pool.QueryRow(r.Context(),
			`SELECT duration_days FROM vip_coupons WHERE code = $1 AND redeemed_by IS NULL`, code,
		).Scan(&durationDays)
		if err == pgx.ErrNoRows {
			// Não distingue "não existe" de "já foi resgatado" na mensagem — evita um endpoint que
			// confirma pra qualquer um se um código específico é válido (só quem já tem o código
			// de verdade chega até aqui).
			apierror.Write(w, http.StatusConflict, "COUPON_INVALID", "Cupom inválido ou já resgatado.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar cupom.")
			return
		}

		tx, err := pool.Begin(r.Context())
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao resgatar cupom.")
			return
		}
		defer func() { _ = tx.Rollback(r.Context()) }()

		// WHERE redeemed_by IS NULL de novo aqui: trava a corrida de duas requisições resgatando o
		// mesmo código ao mesmo tempo (a SELECT acima, fora da transação, não garante isso sozinha).
		tag, err := tx.Exec(r.Context(),
			`UPDATE vip_coupons SET redeemed_by = $1, redeemed_at = now() WHERE code = $2 AND redeemed_by IS NULL`,
			userID, code,
		)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao resgatar cupom.")
			return
		}
		if tag.RowsAffected() == 0 {
			apierror.Write(w, http.StatusConflict, "COUPON_INVALID", "Cupom inválido ou já resgatado.")
			return
		}

		var isVipRaw bool
		var vipExpiresAt *time.Time
		if err := tx.QueryRow(r.Context(),
			`SELECT is_vip, vip_expires_at FROM user_gamification WHERE user_id = $1`, userID,
		).Scan(&isVipRaw, &vipExpiresAt); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar perfil VIP.")
			return
		}

		novaExpiracao := EstenderVIP(isVipRaw, vipExpiresAt, time.Now().UTC(), durationDays)
		if _, err := tx.Exec(r.Context(),
			`UPDATE user_gamification SET is_vip = true, vip_expires_at = $1 WHERE user_id = $2`,
			novaExpiracao, userID,
		); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ativar VIP.")
			return
		}

		if err := tx.Commit(r.Context()); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao concluir resgate do cupom.")
			return
		}

		writeJSON(w, http.StatusOK, redeemCouponResponse{IsVIP: true, VIPExpiresAt: novaExpiracao})
	}
}

// --- POST /v1/vip/subscribe (desabilitado — ver VIPSubscriptionsEnabled) ---

func handleSubscribeVIP(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		if !VIPSubscriptionsEnabled {
			apierror.Write(w, http.StatusNotImplemented, "VIP_SUBSCRIPTION_UNAVAILABLE",
				"Assinatura VIP por cartão ainda não está disponível — em breve. Use um cupom por enquanto.")
			return
		}

		// TODO(pagamento real): ponto de entrada pra integrar Stripe/RevenueCat/IAP — criar sessão
		// de checkout (ou iniciar fluxo de compra in-app), gravar
		// user_gamification.vip_subscription_status = 'pending' e só ativar is_vip/vip_expires_at
		// quando o webhook/callback do provedor confirmar o pagamento (nunca otimista, igual ao
		// resto do sistema de gamificação não inventa saldo sem confirmação).
		apierror.Write(w, http.StatusNotImplemented, "VIP_SUBSCRIPTION_UNAVAILABLE", "Não implementado.")
	}
}
