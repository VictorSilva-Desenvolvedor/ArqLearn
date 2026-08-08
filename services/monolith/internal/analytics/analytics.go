// Package analytics cobre o Serviço de Analytics (SAD §8.8), exposto via a
// Teacher / Analytics API (API Spec §10).
package analytics

import (
	"net/http"

	"arqlearn/monolith/internal/apierror"
)

func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /v1/teacher/classes/{class_id}/summary", apierror.NotImplemented)
}
