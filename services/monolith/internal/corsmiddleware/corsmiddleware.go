// Package corsmiddleware libera chamadas cross-origin do navegador pra este backend — sem isso,
// qualquer fetch feito direto do client-side de apps/web (ex.: AuthContext.loginWithPassword
// buscando o perfil logo após o login, antes de qualquer navegação) é bloqueado pelo próprio
// navegador na etapa de preflight, e nunca chega nem a tentar a rota real. Descoberto ao vivo:
// esse bloqueio silencioso ficava mascarado como "credenciais inválidas" na tela de login,
// porque o catch genérico do fetch não distinguia CORS de 401 de verdade.
package corsmiddleware

import (
	"net/http"
	"slices"
)

// New libera as origens em allowedOrigins (ex.: "http://localhost:3000" em dev). Nenhuma origem
// configurada = CORS desligado (nenhum header adicionado) — mesmo espírito de fallback gracioso
// dos outros pacotes internos (db, documentdb): ausência de config não derruba o processo, só
// deixa o comportamento anterior (sem CORS) em vez de travar.
func New(allowedOrigins []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" && slices.Contains(allowedOrigins, origin) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, Idempotency-Key")
			}

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
