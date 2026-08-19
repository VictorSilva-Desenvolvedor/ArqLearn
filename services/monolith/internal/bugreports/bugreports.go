// Package bugreports cobre a aba "Ajuda e Bugs" (API Spec §14, a pedido do usuário): qualquer
// usuário autenticado relata um bug (com descrição, print e opcionalmente modelo/tipo de
// dispositivo) ou sugere uma melhoria; um admin marca como resolvido, o que credita gemas — 10
// pra bug corrigido, 50 pra sugestão implementada — e insere uma notificação de agradecimento pra
// quem reportou. Primeiro pacote do monólito com checagem de papel (admin) no backend — não
// existia nenhuma antes (ver requireAdmin).
package bugreports

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
	"arqlearn/monolith/internal/gamification"
	"arqlearn/monolith/internal/notifications"
)

const (
	// maxRequestBodyBytes cabe um print de ~2MB codificado em base64 (~33% maior) mais folga pra
	// descrição e overhead de JSON — API Spec §14.
	maxRequestBodyBytes = 3 * 1024 * 1024
	minDescriptionLen   = 10
	maxDescriptionLen   = 2000

	typeBug        = "bug"
	typeSuggestion = "suggestion"

	// Recompensa depende do tipo (API Spec §14, v1.15) — sugestão vale mais porque implementar
	// uma melhoria é normalmente mais trabalho do que corrigir um bug pontual.
	bugFixedGemsReward              = 10
	suggestionImplementedGemsReward = 50
)

func RegisterRoutes(mux *http.ServeMux, pool *pgxpool.Pool, mongoDB *mongo.Database, verifier *authmiddleware.Verifier) {
	mux.Handle("POST /v1/bug-reports", verifier.Middleware(http.HandlerFunc(handleCreateBugReport(pool, mongoDB))))
	mux.Handle("GET /v1/bug-reports", verifier.Middleware(http.HandlerFunc(handleListBugReports(pool, mongoDB))))
	mux.Handle("POST /v1/bug-reports/{id}/resolve", verifier.Middleware(http.HandlerFunc(handleResolveBugReport(pool, mongoDB))))
}

// bugReport espelha a coleção "bug_reports" (Database Design §4.4.5) — screenshot_base64 embute o
// print direto no documento (contorna o bloqueio de R2, ver Docs/PENDENCIAS_IA.md #1). Type
// distingue "bug" de "suggestion" (v1.15) — mesma coleção, não duas separadas; DeviceModel/
// DeviceType só fazem sentido pra "bug" (o formulário só os mostra nesse caso), mas o schema não
// impõe isso.
type bugReport struct {
	ID               string     `bson:"_id" json:"id"`
	UserID           string     `bson:"user_id" json:"user_id"`
	Type             string     `bson:"type" json:"type"`
	Description      string     `bson:"description" json:"description"`
	ScreenshotBase64 string     `bson:"screenshot_base64,omitempty" json:"screenshot_base64,omitempty"`
	DeviceModel      string     `bson:"device_model,omitempty" json:"device_model,omitempty"`
	DeviceType       string     `bson:"device_type,omitempty" json:"device_type,omitempty"`
	Status           string     `bson:"status" json:"status"`
	CreatedAt        time.Time  `bson:"created_at" json:"created_at"`
	ResolvedAt       *time.Time `bson:"resolved_at,omitempty" json:"resolved_at,omitempty"`
}

func gemsRewardFor(reportType string) int {
	if reportType == typeSuggestion {
		return suggestionImplementedGemsReward
	}
	return bugFixedGemsReward
}

func notificationTypeFor(reportType string) string {
	if reportType == typeSuggestion {
		return "suggestion_implemented"
	}
	return "bug_fixed"
}

// errForbidden é devolvido por requireAdmin tanto pra "não é admin" quanto pra qualquer falha ao
// consultar o papel (usuário não encontrado, erro de conexão) — nega acesso por padrão em vez de
// arriscar um 500 que algum chamador trate como "deixa passar".
var errForbidden = errors.New("acesso restrito a administradores")

func requireAdmin(ctx context.Context, pool *pgxpool.Pool, userID string) error {
	var role string
	if err := pool.QueryRow(ctx,
		`SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL`, userID,
	).Scan(&role); err != nil {
		return errForbidden
	}
	if role != "admin" {
		return errForbidden
	}
	return nil
}

type createBugReportRequest struct {
	Type             string  `json:"type"`
	Description      string  `json:"description"`
	ScreenshotBase64 *string `json:"screenshot_base64"`
	DeviceModel      *string `json:"device_model"`
	DeviceType       *string `json:"device_type"`
}

var validDeviceTypes = map[string]bool{"mobile": true, "desktop": true, "tablet": true}

func handleCreateBugReport(pool *pgxpool.Pool, mongoDB *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if pool == nil || mongoDB == nil {
			apierror.Write(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Serviço indisponível.")
			return
		}
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
		var req createBugReportRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			var maxErr *http.MaxBytesError
			if errors.As(err, &maxErr) {
				apierror.Write(w, http.StatusRequestEntityTooLarge, "PAYLOAD_TOO_LARGE",
					"Print grande demais — tente um arquivo menor (limite de ~2MB).")
				return
			}
			apierror.Write(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Corpo da requisição inválido.")
			return
		}

		reportType := req.Type
		if reportType != typeBug && reportType != typeSuggestion {
			apierror.Write(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", `"type" precisa ser "bug" ou "suggestion".`)
			return
		}

		description := strings.TrimSpace(req.Description)
		if len(description) < minDescriptionLen || len(description) > maxDescriptionLen {
			apierror.Write(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR",
				fmt.Sprintf("Descrição precisa ter entre %d e %d caracteres.", minDescriptionLen, maxDescriptionLen))
			return
		}

		report := bugReport{
			ID:          uuid.NewString(),
			UserID:      userID,
			Type:        reportType,
			Description: description,
			Status:      "open",
			CreatedAt:   time.Now().UTC(),
		}
		if req.ScreenshotBase64 != nil {
			report.ScreenshotBase64 = strings.TrimSpace(*req.ScreenshotBase64)
		}
		// device_model/device_type só fazem sentido pra "bug" — aceitos e gravados mesmo assim
		// se vierem numa "suggestion" (não é erro de validação, ver API Spec §14), só não é o
		// caminho que o formulário real usa.
		if req.DeviceModel != nil {
			report.DeviceModel = strings.TrimSpace(*req.DeviceModel)
		}
		if req.DeviceType != nil && validDeviceTypes[*req.DeviceType] {
			report.DeviceType = *req.DeviceType
		}

		if _, err := mongoDB.Collection("bug_reports").InsertOne(r.Context(), report); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao gravar relato de bug.")
			return
		}

		if counters, err := gamification.BumpCounters(r.Context(), pool, userID, gamification.CounterDeltas{BugReports: 1}); err != nil {
			log.Printf("aviso: falha ao atualizar contador de relatos de bug (user_id=%s): %v", userID, err)
		} else if _, err := gamification.EvaluateAndUnlock(r.Context(), pool, userID, counters); err != nil {
			log.Printf("aviso: falha ao avaliar conquistas (user_id=%s): %v", userID, err)
		}

		writeJSON(w, http.StatusCreated, map[string]any{
			"id":         report.ID,
			"status":     report.Status,
			"created_at": report.CreatedAt,
		})
	}
}

// bugReportListItem acrescenta nome/e-mail de quem reportou (consulta separada no Postgres, ver
// reporterInfo) — a coleção Mongo só guarda user_id, e o admin precisa de um jeito legível de
// identificar quem reportou cada bug.
type bugReportListItem struct {
	bugReport
	ReporterName  string `json:"reporter_name"`
	ReporterEmail string `json:"reporter_email"`
}

func handleListBugReports(pool *pgxpool.Pool, mongoDB *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if pool == nil || mongoDB == nil {
			apierror.Write(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Serviço indisponível.")
			return
		}
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}
		if err := requireAdmin(r.Context(), pool, userID); err != nil {
			apierror.Write(w, http.StatusForbidden, "FORBIDDEN_ROLE", "Acesso restrito a administradores.")
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

		filter := bson.M{}
		if status := r.URL.Query().Get("status"); status == "open" || status == "fixed" {
			filter["status"] = status
		}
		if reportType := r.URL.Query().Get("type"); reportType == typeBug || reportType == typeSuggestion {
			filter["type"] = reportType
		}

		findOpts := options.Find().
			SetLimit(int64(limit) + 1).
			SetSkip(int64(offset)).
			SetSort(bson.D{{Key: "created_at", Value: -1}})
		cur, err := mongoDB.Collection("bug_reports").Find(r.Context(), filter, findOpts)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar relatos.")
			return
		}
		defer cur.Close(r.Context())

		var reports []bugReport
		if err := cur.All(r.Context(), &reports); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler relatos.")
			return
		}

		var nextCursor *string
		if len(reports) > limit {
			reports = reports[:limit]
			nc := base64.StdEncoding.EncodeToString([]byte(strconv.Itoa(offset + limit)))
			nextCursor = &nc
		}

		names, emails, err := reporterInfo(r.Context(), pool, reports)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar autores dos relatos.")
			return
		}

		items := make([]bugReportListItem, 0, len(reports))
		for _, rep := range reports {
			items = append(items, bugReportListItem{
				bugReport:     rep,
				ReporterName:  names[rep.UserID],
				ReporterEmail: emails[rep.UserID],
			})
		}

		writeJSON(w, http.StatusOK, map[string]any{"data": items, "next_cursor": nextCursor})
	}
}

func reporterInfo(ctx context.Context, pool *pgxpool.Pool, reports []bugReport) (names, emails map[string]string, err error) {
	names, emails = map[string]string{}, map[string]string{}
	if len(reports) == 0 {
		return names, emails, nil
	}

	seen := map[string]bool{}
	ids := make([]string, 0, len(reports))
	for _, rep := range reports {
		if !seen[rep.UserID] {
			seen[rep.UserID] = true
			ids = append(ids, rep.UserID)
		}
	}

	rows, err := pool.Query(ctx, `SELECT id, name, email FROM users WHERE id = ANY($1)`, ids)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var id, name, email string
		if err := rows.Scan(&id, &name, &email); err != nil {
			return nil, nil, err
		}
		names[id] = name
		emails[id] = email
	}
	return names, emails, rows.Err()
}

func handleResolveBugReport(pool *pgxpool.Pool, mongoDB *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if pool == nil || mongoDB == nil {
			apierror.Write(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Serviço indisponível.")
			return
		}
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}
		if err := requireAdmin(r.Context(), pool, userID); err != nil {
			apierror.Write(w, http.StatusForbidden, "FORBIDDEN_ROLE", "Acesso restrito a administradores.")
			return
		}

		reportID := r.PathValue("id")

		var report bugReport
		err := mongoDB.Collection("bug_reports").FindOne(r.Context(), bson.M{"_id": reportID}).Decode(&report)
		if err == mongo.ErrNoDocuments {
			apierror.Write(w, http.StatusNotFound, "BUG_REPORT_NOT_FOUND", "Relato de bug inexistente.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar relato.")
			return
		}
		// Guarda de idempotência: resolver de novo um relato já "fixed" não concede gemas uma
		// segunda vez (API Spec §14).
		if report.Status == "fixed" {
			apierror.Write(w, http.StatusConflict, "BUG_REPORT_ALREADY_RESOLVED", "Este relato já foi marcado como corrigido.")
			return
		}

		now := time.Now().UTC()
		if _, err := mongoDB.Collection("bug_reports").UpdateOne(r.Context(),
			bson.M{"_id": reportID},
			bson.M{"$set": bson.M{"status": "fixed", "resolved_at": now}},
		); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar relato.")
			return
		}

		gemsReward, newGemsTotal, err := gamification.AwardGems(r.Context(), pool, report.UserID, gemsRewardFor(report.Type))
		if err != nil {
			// Estado parcial (relato já "fixed" no Mongo, gemas não creditadas no Postgres) —
			// sinalizado alto e claro em vez de escondido; corrigir manualmente é mais simples
			// do que uma transação distribuída entre os dois bancos pra um prêmio de gemas.
			log.Printf("aviso: bug_report %s marcado fixed mas falhou ao creditar gemas (user_id=%s): %v", reportID, report.UserID, err)
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Relato marcado como corrigido, mas falhou ao conceder gemas — verificar manualmente.")
			return
		}

		var message string
		if report.Type == typeSuggestion {
			message = fmt.Sprintf(
				"Sua sugestão foi implementada! Obrigado pela ideia — você ganhou %d gemas.", gemsReward)
		} else {
			message = fmt.Sprintf(
				"Obrigado por reportar um bug! Corrigimos o problema que você encontrou e você ganhou %d gemas.", gemsReward)
		}
		if err := notifications.Create(r.Context(), mongoDB, report.UserID, notificationTypeFor(report.Type), message); err != nil {
			log.Printf("aviso: falha ao notificar %s (bug_report_id=%s, user_id=%s): %v", notificationTypeFor(report.Type), reportID, report.UserID, err)
		}

		// Conquista credita a quem REPORTOU (report.UserID), não ao admin que resolveu.
		if counters, err := gamification.BumpCounters(r.Context(), pool, report.UserID, gamification.CounterDeltas{BugReportsResolved: 1}); err != nil {
			log.Printf("aviso: falha ao atualizar contador de bugs corrigidos (user_id=%s): %v", report.UserID, err)
		} else if _, err := gamification.EvaluateAndUnlock(r.Context(), pool, report.UserID, counters); err != nil {
			log.Printf("aviso: falha ao avaliar conquistas (user_id=%s): %v", report.UserID, err)
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"id":                  report.ID,
			"status":              "fixed",
			"gems_awarded":        gemsReward,
			"reporter_gems_total": newGemsTotal,
		})
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
