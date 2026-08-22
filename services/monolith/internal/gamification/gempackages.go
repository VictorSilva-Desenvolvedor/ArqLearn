// Pacotes de gemas comprados com dinheiro real (TDD §16) — mesmo molde de vip.go: catálogo real
// (GET), checkout travado atrás de uma constante até um gateway de pagamento existir (POST
// .../checkout, mockup deliberado), e cupom de 10 dígitos gerado por admin como caminho 100%
// funcional hoje (mesmo padrão de vip_coupons). Isolado num arquivo próprio pelo mesmo motivo de
// vip.go — não fazer gamification.go crescer ainda mais.
package gamification

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
)

// GemPackagePurchasesEnabled trava POST .../gem-packages/{id}/checkout atrás de um 501 até um
// gateway de pagamento (Stripe/PIX) ser integrado de verdade — mesmo padrão de
// VIPSubscriptionsEnabled (vip.go). Vira true só quando esse trabalho futuro acontecer.
const GemPackagePurchasesEnabled = false

// --- GET /v1/gamification/gem-packages ---

type gemPackageJSON struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	GemsAmount    int    `json:"gems_amount"`
	PriceBRLCents int    `json:"price_brl_cents"`
}

func handleListGemPackages(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if _, ok := authmiddleware.UserID(r.Context()); !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		rows, err := pool.Query(r.Context(), `
			SELECT id, name, gems_amount, price_brl_cents FROM gem_packages
			WHERE active = true ORDER BY sort_order ASC
		`)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar pacotes de gemas.")
			return
		}
		defer rows.Close()

		packages := []gemPackageJSON{}
		for rows.Next() {
			var p gemPackageJSON
			if err := rows.Scan(&p.ID, &p.Name, &p.GemsAmount, &p.PriceBRLCents); err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler pacotes de gemas.")
				return
			}
			packages = append(packages, p)
		}
		writeJSON(w, http.StatusOK, map[string]any{"data": packages})
	}
}

// --- POST /v1/gamification/gem-packages/{package_id}/checkout (desabilitado — ver GemPackagePurchasesEnabled) ---

func handleCheckoutGemPackage(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if _, ok := authmiddleware.UserID(r.Context()); !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		if !GemPackagePurchasesEnabled {
			apierror.Write(w, http.StatusNotImplemented, "GEM_PACKAGE_PURCHASE_UNAVAILABLE",
				"Compra de gemas por cartão ainda não está disponível — em breve. Use um cupom por enquanto.")
			return
		}

		packageID := r.PathValue("package_id")
		if _, err := uuid.Parse(packageID); err != nil {
			apierror.Write(w, http.StatusNotFound, "GEM_PACKAGE_NOT_FOUND", "Pacote de gemas não encontrado.")
			return
		}

		// TODO(pagamento real): ponto de entrada pra integrar Stripe/PIX — criar sessão de
		// checkout (ou iniciar fluxo de compra in-app) pro pacote pedido, e só creditar gems via
		// RecordGemTransaction(..., GemReasonGemCoupon, ...) quando o webhook/callback do provedor
		// confirmar o pagamento (nunca otimista, igual ao resto do sistema de gamificação não
		// inventa saldo sem confirmação).
		apierror.Write(w, http.StatusNotImplemented, "GEM_PACKAGE_PURCHASE_UNAVAILABLE", "Não implementado.")
	}
}

// --- POST /v1/gamification/gem-coupons (admin) ---

type createGemCouponRequest struct {
	GemsAmount int `json:"gems_amount"`
}

type createGemCouponResponse struct {
	Code       string `json:"code"`
	GemsAmount int    `json:"gems_amount"`
}

// handleCreateGemCoupon exige role=admin (checado direto na tabela users, mesmo padrão de
// handleCreateVIPCoupon — não há middleware de papel no projeto ainda). Sem painel admin nesta
// fase: chamada direta via curl/Postman, documentada na API Spec, mesma decisão já tomada pro VIP.
func handleCreateGemCoupon(pool *pgxpool.Pool) http.HandlerFunc {
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
			apierror.Write(w, http.StatusForbidden, "ADMIN_REQUIRED", "Só administradores podem gerar cupons de gemas.")
			return
		}

		var req createGemCouponRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.GemsAmount <= 0 {
			apierror.Write(w, http.StatusBadRequest, "INVALID_BODY", "gems_amount deve ser um inteiro positivo.")
			return
		}

		// Colisão de código é extremamente improvável (espaço de 10^10, mesmo gerador de
		// vip_coupons), mas o UNIQUE da coluna está lá — algumas tentativas curtas em vez de
		// assumir que nunca vai colidir.
		const maxTentativas = 5
		for i := 0; i < maxTentativas; i++ {
			code, err := gerarCodigoCupom()
			if err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao gerar código do cupom.")
				return
			}
			_, err = pool.Exec(r.Context(), `
				INSERT INTO gem_coupons (id, code, gems_amount, created_by) VALUES ($1, $2, $3, $4)
			`, uuid.New(), code, req.GemsAmount, userID)
			if err == nil {
				writeJSON(w, http.StatusCreated, createGemCouponResponse{Code: code, GemsAmount: req.GemsAmount})
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

// --- POST /v1/gamification/gem-coupons/redeem ---

type redeemGemCouponRequest struct {
	Code string `json:"code"`
}

type redeemGemCouponResponse struct {
	GemsCredited int `json:"gems_credited"`
	Gems         int `json:"gems"`
}

func handleRedeemGemCoupon(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var req redeemGemCouponRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Code) == "" {
			apierror.Write(w, http.StatusBadRequest, "INVALID_BODY", "Informe o código do cupom.")
			return
		}
		code := strings.TrimSpace(req.Code)

		var gemsAmount int
		err := pool.QueryRow(r.Context(),
			`SELECT gems_amount FROM gem_coupons WHERE code = $1 AND redeemed_by IS NULL`, code,
		).Scan(&gemsAmount)
		if err == pgx.ErrNoRows {
			// Não distingue "não existe" de "já foi resgatado" — mesmo motivo de
			// handleRedeemVIPCoupon (evita confirmar validade de um código pra quem não o tem).
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

		// WHERE redeemed_by IS NULL de novo aqui: trava a corrida de duas requisições resgatando
		// o mesmo código ao mesmo tempo, mesmo padrão de handleRedeemVIPCoupon.
		tag, err := tx.Exec(r.Context(),
			`UPDATE gem_coupons SET redeemed_by = $1, redeemed_at = now() WHERE code = $2 AND redeemed_by IS NULL`,
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

		// Sem VIPGemsMultiplier de propósito: um pacote pago credita exatamente o que foi pago,
		// não é "ganho" sujeito ao bônus VIP (esse é só pra gemas ganhas por esforço).
		var newGems int
		if err := tx.QueryRow(r.Context(),
			`UPDATE user_gamification SET gems = gems + $1 WHERE user_id = $2 RETURNING gems`,
			gemsAmount, userID,
		).Scan(&newGems); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao creditar gemas.")
			return
		}

		if err := RecordGemTransaction(r.Context(), tx, userID, gemsAmount, GemReasonGemCoupon, code, newGems); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao registrar extrato.")
			return
		}

		if err := tx.Commit(r.Context()); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao concluir resgate do cupom.")
			return
		}

		writeJSON(w, http.StatusOK, redeemGemCouponResponse{GemsCredited: gemsAmount, Gems: newGems})
	}
}
