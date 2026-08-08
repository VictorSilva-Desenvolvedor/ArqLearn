// Package notifications cobre o Notifications Service (SAD §8.7 / API Spec §9).
package notifications

import (
	"net/http"

	"arqlearn/monolith/internal/apierror"
)

func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /v1/notifications", apierror.NotImplemented)
	mux.HandleFunc("PATCH /v1/notifications/preferences", apierror.NotImplemented)
}
