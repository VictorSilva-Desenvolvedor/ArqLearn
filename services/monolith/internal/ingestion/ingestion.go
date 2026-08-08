// Package ingestion cobre o Ingestion Service (SAD §8.4 / API Spec §7). Uploads usam
// URL pré-assinada direto ao object storage — nunca fazer proxy de binário pela API
// (ver Docs/CLAUDE.md, "O que NÃO fazer").
package ingestion

import (
	"net/http"

	"arqlearn/monolith/internal/apierror"
)

func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/uploads", apierror.NotImplemented)
	mux.HandleFunc("POST /v1/uploads/{upload_id}/complete", apierror.NotImplemented)
	mux.HandleFunc("GET /v1/uploads/{upload_id}", apierror.NotImplemented)
	mux.HandleFunc("GET /v1/uploads/{upload_id}/questions", apierror.NotImplemented)
	mux.HandleFunc("PATCH /v1/uploads/{upload_id}/questions/{question_id}", apierror.NotImplemented)
}
