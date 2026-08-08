package authmiddleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestBearerToken(t *testing.T) {
	casos := []struct {
		nome      string
		header    string
		querToken string
		querOk    bool
	}{
		{"ausente", "", "", false},
		{"sem prefixo Bearer", "token-cru", "", false},
		{"vazio depois do Bearer", "Bearer ", "", false},
		{"valido", "Bearer abc.def.ghi", "abc.def.ghi", true},
		{"valido com espacos extras", "Bearer   abc.def.ghi  ", "abc.def.ghi", true},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			r := httptest.NewRequest(http.MethodGet, "/", nil)
			if c.header != "" {
				r.Header.Set("Authorization", c.header)
			}
			token, ok := bearerToken(r)
			if ok != c.querOk || token != c.querToken {
				t.Errorf("bearerToken() = (%q, %v), esperado (%q, %v)", token, ok, c.querToken, c.querOk)
			}
		})
	}
}

// fakeSupabase simula GET /auth/v1/user: token "valid-token" retorna um usuário, qualquer
// outro retorna 401 — o suficiente para testar Middleware sem depender do Supabase real.
func fakeSupabase(t *testing.T) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/auth/v1/user" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		if r.Header.Get("Authorization") != "Bearer valid-token" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"id": "user-123"})
	}))
}

func TestMiddleware_SemToken(t *testing.T) {
	srv := fakeSupabase(t)
	defer srv.Close()
	v := NewVerifier(srv.URL, "publishable-key")

	called := false
	handler := v.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { called = true }))

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/", nil))

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, esperado 401", rr.Code)
	}
	if called {
		t.Error("handler protegido não deveria ter sido chamado sem token")
	}
}

func TestMiddleware_TokenInvalido(t *testing.T) {
	srv := fakeSupabase(t)
	defer srv.Close()
	v := NewVerifier(srv.URL, "publishable-key")

	handler := v.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler protegido não deveria ter sido chamado com token inválido")
	}))

	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.Header.Set("Authorization", "Bearer token-invalido")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, r)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, esperado 401", rr.Code)
	}
}

func TestMiddleware_TokenValido(t *testing.T) {
	srv := fakeSupabase(t)
	defer srv.Close()
	v := NewVerifier(srv.URL, "publishable-key")

	var gotUserID string
	var gotOk bool
	handler := v.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotUserID, gotOk = UserID(r.Context())
		w.WriteHeader(http.StatusOK)
	}))

	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.Header.Set("Authorization", "Bearer valid-token")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, r)

	if rr.Code != http.StatusOK {
		t.Errorf("status = %d, esperado 200", rr.Code)
	}
	if !gotOk || gotUserID != "user-123" {
		t.Errorf("UserID() = (%q, %v), esperado (%q, true)", gotUserID, gotOk, "user-123")
	}
}

func TestUserID_ForaDoMiddleware(t *testing.T) {
	_, ok := UserID(httptest.NewRequest(http.MethodGet, "/", nil).Context())
	if ok {
		t.Error("UserID() deveria retornar ok=false num contexto sem Middleware")
	}
}
