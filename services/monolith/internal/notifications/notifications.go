// Package notifications cobre o Notifications Service (SAD §8.7 / API Spec §9). Nenhum código
// ainda escreve notificações de verdade (streak_at_risk, league_promotion etc. dependem de jobs
// agendados que não existem — mesmo padrão de "sem consumidor de fila real" documentado em
// Docs/CLAUDE.md sobre cmd/worker) — GET /v1/notifications real, mas legitimamente vazio até
// algum gatilho passar a inserir na coleção. Preferências de canal (push/e-mail) são reais desde
// já, independem de notificação nenhuma existir.
package notifications

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
)

func RegisterRoutes(mux *http.ServeMux, pool *pgxpool.Pool, mongoDB *mongo.Database, verifier *authmiddleware.Verifier) {
	mux.Handle("GET /v1/notifications", verifier.Middleware(http.HandlerFunc(handleListNotifications(mongoDB))))
	mux.Handle("PATCH /v1/notifications/preferences", verifier.Middleware(http.HandlerFunc(handleUpdatePreferences(pool))))
}

// notification espelha a coleção "notifications" (nova — nunca existia schema nenhum pra isso).
type notification struct {
	ID        string    `bson:"_id" json:"id"`
	Type      string    `bson:"type" json:"type"`
	Message   string    `bson:"message" json:"message"`
	Read      bool      `bson:"read" json:"read"`
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
}

func handleListNotifications(mongoDB *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if mongoDB == nil {
			apierror.Write(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Serviço indisponível.")
			return
		}
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		limit := 20
		if raw := r.URL.Query().Get("limit"); raw != "" {
			if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 && parsed <= 100 {
				limit = parsed
			}
		}
		offset := 0
		if raw := r.URL.Query().Get("cursor"); raw != "" {
			if decoded, err := base64.StdEncoding.DecodeString(raw); err == nil {
				if parsed, err := strconv.Atoi(string(decoded)); err == nil {
					offset = parsed
				}
			}
		}

		findOpts := options.Find().SetLimit(int64(limit) + 1).SetSkip(int64(offset)).SetSort(bson.D{{Key: "created_at", Value: -1}})
		cur, err := mongoDB.Collection("notifications").Find(r.Context(), bson.M{"user_id": userID}, findOpts)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar notificações.")
			return
		}
		defer cur.Close(r.Context())

		var items []notification
		if err := cur.All(r.Context(), &items); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler notificações.")
			return
		}
		if items == nil {
			items = []notification{}
		}

		var nextCursor *string
		if len(items) > limit {
			items = items[:limit]
			nc := base64.StdEncoding.EncodeToString([]byte(strconv.Itoa(offset + limit)))
			nextCursor = &nc
		}

		writeJSON(w, http.StatusOK, map[string]any{"data": items, "next_cursor": nextCursor})
	}
}

type updatePreferencesRequest struct {
	PushEnabled  *bool `json:"push_enabled"`
	EmailEnabled *bool `json:"email_enabled"`
}

type preferencesResponse struct {
	PushEnabled  bool `json:"push_enabled"`
	EmailEnabled bool `json:"email_enabled"`
}

func handleUpdatePreferences(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if pool == nil {
			apierror.Write(w, http.StatusServiceUnavailable, "DATABASE_UNAVAILABLE", "Sem conexão com o banco.")
			return
		}
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var req updatePreferencesRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			apierror.Write(w, http.StatusBadRequest, "INVALID_BODY", "Corpo da requisição inválido.")
			return
		}

		var resp preferencesResponse
		err := pool.QueryRow(r.Context(), `
			UPDATE users SET
			  push_enabled = COALESCE($1, push_enabled),
			  email_enabled = COALESCE($2, email_enabled)
			WHERE id = $3 AND deleted_at IS NULL
			RETURNING push_enabled, email_enabled
		`, req.PushEnabled, req.EmailEnabled, userID).Scan(&resp.PushEnabled, &resp.EmailEnabled)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusNotFound, "USER_PROFILE_NOT_FOUND", "Perfil de usuário não encontrado.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar preferências.")
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
