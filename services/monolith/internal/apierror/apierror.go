// Package apierror implementa o formato de erro padrão exigido para todo endpoint
// (ver Docs/CLAUDE.md, "Convenções de código" e Docs/ArqLearn_API_Specification.md §2.3).
package apierror

import (
	"encoding/json"
	"net/http"
)

type Body struct {
	ErrorCode string         `json:"error_code"`
	Message   string         `json:"message"`
	TraceID   string         `json:"trace_id,omitempty"`
	Details   map[string]any `json:"details,omitempty"`
}

func Write(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(Body{
		ErrorCode: code,
		Message:   message,
	})
}

// NotImplemented é o handler placeholder de todo endpoint ainda não implementado
// nesta fase de scaffold — cada rota real deve substituir isso por sua própria lógica.
func NotImplemented(w http.ResponseWriter, r *http.Request) {
	Write(w, http.StatusNotImplemented, "NOT_IMPLEMENTED", "Endpoint ainda não implementado.")
}
