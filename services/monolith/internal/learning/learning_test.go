package learning

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// Os quatro testes abaixo confirmam que cada handler checa a disponibilidade do banco ANTES
// de tentar usá-lo — chamar com pool/mongoDB nil aqui provaria isso via panic (nil pointer
// dereference) se a ordem estivesse errada, em vez de silenciosamente responder 503.

func TestHandleListTracks_SemMongo(t *testing.T) {
	rr := httptest.NewRecorder()
	handleListTracks(nil).ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/v1/tracks", nil))
	if rr.Code != http.StatusServiceUnavailable {
		t.Errorf("status = %d, esperado 503", rr.Code)
	}
}

func TestHandleListTrackLessons_SemMongo(t *testing.T) {
	rr := httptest.NewRecorder()
	handleListTrackLessons(nil).ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/v1/tracks/x/lessons", nil))
	if rr.Code != http.StatusServiceUnavailable {
		t.Errorf("status = %d, esperado 503", rr.Code)
	}
}

func TestHandleStartSession_SemBanco(t *testing.T) {
	rr := httptest.NewRecorder()
	handleStartSession(nil, nil).ServeHTTP(rr, httptest.NewRequest(http.MethodPost, "/v1/lessons/x/session", nil))
	if rr.Code != http.StatusServiceUnavailable {
		t.Errorf("status = %d, esperado 503", rr.Code)
	}
}

func TestHandleSubmitAnswer_SemBanco(t *testing.T) {
	rr := httptest.NewRecorder()
	handleSubmitAnswer(nil, nil).ServeHTTP(rr, httptest.NewRequest(http.MethodPost, "/v1/lessons/x/answers", nil))
	if rr.Code != http.StatusServiceUnavailable {
		t.Errorf("status = %d, esperado 503", rr.Code)
	}
}

func TestCursor_RoundTrip(t *testing.T) {
	original := cursorPayload{Offset: 40}
	encoded := encodeCursor(original)

	decoded, err := decodeCursor(encoded)
	if err != nil {
		t.Fatalf("decodeCursor() erro inesperado: %v", err)
	}
	if decoded != original {
		t.Errorf("decodeCursor(encodeCursor(%v)) = %v, esperado igual", original, decoded)
	}
}

func TestDecodeCursor_Invalido(t *testing.T) {
	if _, err := decodeCursor("não é base64 válido!!!"); err == nil {
		t.Error("decodeCursor() deveria falhar com entrada inválida")
	}
}
