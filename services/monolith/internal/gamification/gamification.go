// Package gamification cobre o Gamification Service (SAD §8.6 / API Spec §8).
// Regras de negócio (calcularXP, limite diário de XP, streak, ligas) vêm do
// Docs/ArqLearn_TDD_Technical_Design_Document.md — não reimplementar de memória.
package gamification

import (
	"net/http"

	"arqlearn/monolith/internal/apierror"
)

func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /v1/gamification/me", apierror.NotImplemented)
	mux.HandleFunc("GET /v1/gamification/league", apierror.NotImplemented)
	mux.HandleFunc("POST /v1/gamification/streak/freeze", apierror.NotImplemented)
	mux.HandleFunc("POST /v1/gamification/shop/purchase", apierror.NotImplemented)
}
