// Package authmiddleware valida o JWT emitido pelo Supabase Auth em requisições protegidas
// (ver Docs/ArqLearn_API_Specification.md §2.2/§4). O cliente (apps/web, apps/mobile) fala
// direto com o Supabase Auth para login/registro/OAuth — este pacote só confirma que o token
// recebido é válido e descobre a quem ele pertence.
package authmiddleware

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"arqlearn/monolith/internal/apierror"
)

type contextKey string

const userIDKey contextKey = "supabase_user_id"

// Verifier valida tokens chamando GET /auth/v1/user no próprio Supabase, em vez de verificar
// a assinatura do JWT localmente — evita reimplementar verificação criptográfica sem confirmar
// antes o esquema de assinatura exato do projeto (HS256 com segredo compartilhado vs. JWKS
// assimétrico). Trocar por validação local é uma otimização futura, não urgente no volume da
// fase bootstrap (ver Docs/ArqLearn_Estrategia_Bootstrap.md).
type Verifier struct {
	SupabaseURL         string
	SupabasePublishable string
	HTTPClient          *http.Client
}

func NewVerifier(supabaseURL, publishableKey string) *Verifier {
	return &Verifier{
		SupabaseURL:         strings.TrimRight(supabaseURL, "/"),
		SupabasePublishable: publishableKey,
		HTTPClient:          &http.Client{},
	}
}

// Middleware exige Authorization: Bearer <token> válido, injeta o user_id (claim "sub" do
// Supabase) no contexto da requisição, e responde 401 UNAUTHENTICATED (API Spec §12) caso
// contrário. Handlers atrás deste middleware nunca devem confiar em user_id vindo de outro
// lugar (body, query param) — ver Docs/CLAUDE.md, "Regras de negócio críticas".
func (v *Verifier) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, ok := bearerToken(r)
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token ausente ou mal formatado.")
			return
		}

		userID, err := v.verify(r.Context(), token)
		if err != nil {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido ou expirado.")
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func bearerToken(r *http.Request) (string, bool) {
	const prefix = "Bearer "
	h := r.Header.Get("Authorization")
	if !strings.HasPrefix(h, prefix) {
		return "", false
	}
	token := strings.TrimSpace(strings.TrimPrefix(h, prefix))
	return token, token != ""
}

type supabaseUser struct {
	ID string `json:"id"`
}

func (v *Verifier) verify(ctx context.Context, token string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, v.SupabaseURL+"/auth/v1/user", nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("apikey", v.SupabasePublishable)

	resp, err := v.HTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("supabase auth respondeu %d", resp.StatusCode)
	}

	var user supabaseUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return "", err
	}
	if user.ID == "" {
		return "", fmt.Errorf("resposta do supabase sem id de usuário")
	}
	return user.ID, nil
}

// UserID extrai o id do usuário autenticado do contexto — só retorna ok=true em handlers
// montados atrás de Middleware.
func UserID(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(userIDKey).(string)
	return id, ok
}
