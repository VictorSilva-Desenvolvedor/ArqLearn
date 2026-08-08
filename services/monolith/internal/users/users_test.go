package users

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestHandleGetMe_SemUserIDNoContexto confere o caminho que não depende de banco: se o
// middleware de auth não rodou (ou falhou em injetar o user_id), o handler nunca chega a
// consultar o Postgres — chamar com pool=nil aqui provaria isso (um nil pointer dereference
// significaria que o handler tentou usar o banco antes de checar autenticação).
func TestHandleGetMe_SemUserIDNoContexto(t *testing.T) {
	handler := handleGetMe(nil)

	rr := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/v1/users/me", nil)

	handler.ServeHTTP(rr, r)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, esperado 401", rr.Code)
	}
}
