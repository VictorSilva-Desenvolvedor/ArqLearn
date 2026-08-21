// Package notifications cobre o Notifications Service (SAD §8.7 / API Spec §9). GET
// /v1/notifications, preferências de canal (push/e-mail) e registro de push token são reais.
// streak_at_risk é gravado de verdade por Decide (decide.go), chamado a cada hora por
// cmd/notify-decide (TDD §11) — bandit de template (Thompson Sampling) escolhe a mensagem,
// respeitando janela horária local, cooldown e teto diário. league_promotion e os demais tipos do
// enum ainda dependem de gatilhos que não existem (mesmo padrão de "sem consumidor de fila real"
// documentado em Docs/CLAUDE.md sobre cmd/worker).
package notifications

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
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
	mux.Handle("POST /v1/notifications/push-token", verifier.Middleware(http.HandlerFunc(handleRegisterPushToken(pool))))
}

// notification espelha a coleção "notifications" (nova — nunca existia schema nenhum pra isso).
type notification struct {
	ID        string    `bson:"_id" json:"id"`
	UserID    string    `bson:"user_id" json:"-"` // nunca serializado — API Spec §9 não expõe user_id (a lista já é escopada pro usuário autenticado)
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

type registerPushTokenRequest struct {
	Token    string `json:"token"`
	Platform string `json:"platform"`
}

// handleRegisterPushToken implementa POST /v1/notifications/push-token (API Spec §9): grava/
// atualiza o token de push Expo do device atual. ON CONFLICT no token (não no user_id) porque um
// mesmo device pode trocar de conta logada — a linha existente do token simplesmente passa a
// apontar pro novo user_id, em vez de acumular tokens órfãos da conta anterior nesse device.
func handleRegisterPushToken(pool *pgxpool.Pool) http.HandlerFunc {
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

		var req registerPushTokenRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Token == "" {
			apierror.Write(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Campo token é obrigatório.")
			return
		}

		_, err := pool.Exec(r.Context(), `
			INSERT INTO user_push_tokens (id, user_id, token, platform)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (token) DO UPDATE SET user_id = $2, platform = $4
		`, uuid.NewString(), userID, req.Token, req.Platform)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao registrar token de push.")
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{"registered": true})
	}
}

// Create insere uma notificação real pro usuário — hoje só chamada pelo pacote bugreports
// (POST /v1/bug-reports/{id}/resolve, API Spec §14): é o primeiro gatilho síncrono desta coleção,
// os demais tipos (streak_at_risk, league_promotion...) ainda dependem de jobs que não existem
// (ver comentário no topo do arquivo).
func Create(ctx context.Context, mongoDB *mongo.Database, userID, notifType, message string) error {
	_, err := mongoDB.Collection("notifications").InsertOne(ctx, notification{
		ID:        uuid.NewString(),
		UserID:    userID,
		Type:      notifType,
		Message:   message,
		Read:      false,
		CreatedAt: time.Now().UTC(),
	})
	return err
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
