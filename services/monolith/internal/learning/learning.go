// Package learning cobre o Learning Service (SAD §8.3 / API Spec §6), incluindo Modo
// Infinito (§6.1), Resumo Inteligente (§6.2) e Chat sobre Material (§6.3) — adicionados
// no escopo v1.1 (ver Docs/ArqLearn_Documento_Arquitetura_Software.md §3.1, RF-11 a RF-13).
package learning

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"sort"
	"strconv"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
	"arqlearn/monolith/internal/groqclient"
)

func RegisterRoutes(mux *http.ServeMux, pool *pgxpool.Pool, mongoDB *mongo.Database, verifier *authmiddleware.Verifier, groq *groqclient.Client) {
	// Trilhas e progresso — API Spec §6
	mux.Handle("GET /v1/tracks", verifier.Middleware(http.HandlerFunc(handleListTracks(mongoDB))))
	mux.Handle("GET /v1/tracks/{track_id}/lessons", verifier.Middleware(http.HandlerFunc(handleListTrackLessons(mongoDB))))
	mux.Handle("POST /v1/lessons/{lesson_id}/session", verifier.Middleware(http.HandlerFunc(handleStartSession(pool, mongoDB))))
	mux.Handle("POST /v1/lessons/{lesson_id}/answers", verifier.Middleware(http.HandlerFunc(handleSubmitAnswer(pool, mongoDB))))
	mux.Handle("POST /v1/lessons/{lesson_id}/questions/{question_id}/explain", verifier.Middleware(http.HandlerFunc(handleExplainQuestion(mongoDB, groq))))
	mux.Handle("GET /v1/progress/summary", verifier.Middleware(http.HandlerFunc(handleProgressSummary(mongoDB))))

	// Modo Infinito — API Spec §6.1
	mux.Handle("POST /v1/infinite-mode/sessions", verifier.Middleware(http.HandlerFunc(apierror.NotImplemented)))
	mux.Handle("POST /v1/infinite-mode/sessions/{session_id}/answers", verifier.Middleware(http.HandlerFunc(apierror.NotImplemented)))
	mux.Handle("POST /v1/infinite-mode/sessions/{session_id}/end", verifier.Middleware(http.HandlerFunc(apierror.NotImplemented)))

	// Resumo Inteligente — API Spec §6.2
	mux.Handle("GET /v1/uploads/{upload_id}/summary", verifier.Middleware(http.HandlerFunc(apierror.NotImplemented)))

	// Chat sobre Material — API Spec §6.3
	mux.Handle("POST /v1/uploads/{upload_id}/chat", verifier.Middleware(http.HandlerFunc(apierror.NotImplemented)))
	mux.Handle("GET /v1/uploads/{upload_id}/chat", verifier.Middleware(http.HandlerFunc(apierror.NotImplemented)))
}

// track espelha a coleção "tracks" (Database Design §4.1).
type track struct {
	ID     string      `bson:"_id" json:"id"`
	Title  string      `bson:"title" json:"title"`
	Topic  string      `bson:"topic" json:"topic"`
	Origin string      `bson:"origin" json:"origin"`
	Units  []trackUnit `bson:"units" json:"-"` // não serializado em /v1/tracks — só usado internamente para ordenar lições
}

type trackUnit struct {
	ID        string   `bson:"id"`
	Title     string   `bson:"title"`
	Order     int      `bson:"order"`
	LessonIDs []string `bson:"lesson_ids"`
}

// orderedLessonIDs achata track.units (já na ordem "order" de cada unidade) numa sequência
// única de lesson_id — é essa sequência que define a ordem pedagógica real de uma trilha,
// não a ordem alfabética de _id (ver handleListTrackLessons).
func (t track) orderedLessonIDs() []string {
	units := make([]trackUnit, len(t.Units))
	copy(units, t.Units)
	sort.Slice(units, func(i, j int) bool { return units[i].Order < units[j].Order })

	var ids []string
	for _, u := range units {
		ids = append(ids, u.LessonIDs...)
	}
	return ids
}

type cursorPayload struct {
	Offset int `json:"offset"`
}

// handleListTracks implementa GET /v1/tracks (API Spec §6): filtro por topic/origin,
// paginação por cursor (API Spec §2.4) — cursor é base64 de {"offset": N}, o mesmo esquema já
// usado como exemplo na própria API Specification.
func handleListTracks(mongoDB *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if mongoDB == nil {
			apierror.Write(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Banco de documentos indisponível.")
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
			if decoded, err := decodeCursor(raw); err == nil {
				offset = decoded.Offset
			}
		}

		filter := bson.M{}
		if topic := r.URL.Query().Get("topic"); topic != "" {
			filter["topic"] = topic
		}
		if origin := r.URL.Query().Get("origin"); origin != "" {
			filter["origin"] = origin
		}

		// Busca limit+1 para saber se existe próxima página sem um count() separado.
		findOpts := options.Find().
			SetLimit(int64(limit) + 1).
			SetSkip(int64(offset)).
			SetSort(bson.D{{Key: "_id", Value: 1}})

		cur, err := mongoDB.Collection("tracks").Find(r.Context(), filter, findOpts)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar trilhas.")
			return
		}
		defer cur.Close(r.Context())

		var tracks []track
		if err := cur.All(r.Context(), &tracks); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler trilhas.")
			return
		}

		var nextCursor *string
		if len(tracks) > limit {
			tracks = tracks[:limit]
			nc := encodeCursor(cursorPayload{Offset: offset + limit})
			nextCursor = &nc
		}
		if tracks == nil {
			tracks = []track{}
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"data":        tracks,
			"next_cursor": nextCursor,
		})
	}
}

// lesson espelha a coleção "lessons" (Database Design §4.2). Order não existe no documento —
// é calculado em handleListTrackLessons a partir de track.units (ver orderedLessonIDs) e só
// preenchido ao montar a resposta, nunca lido/gravado no Mongo (daí bson:"-").
type lesson struct {
	ID               string   `bson:"_id" json:"id"`
	TrackID          string   `bson:"track_id" json:"track_id"`
	Title            string   `bson:"title" json:"title"`
	Difficulty       string   `bson:"difficulty" json:"difficulty"`
	QuestionIDs      []string `bson:"question_ids" json:"question_ids"`
	EstimatedMinutes int      `bson:"estimated_minutes" json:"estimated_minutes"`
	Order            int      `bson:"-" json:"order"`
}

type lessonListItem struct {
	Lesson         lesson `json:"lesson"`
	ProgressStatus string `json:"progress_status"`
}

// userProgressStatus é a projeção mínima da coleção "user_progress" (Database Design §4.4)
// necessária para montar progress_status — não carrega srs_state/contadores aqui.
type userProgressStatus struct {
	LessonID string `bson:"lesson_id"`
	Status   string `bson:"status"`
}

// handleListTrackLessons implementa GET /v1/tracks/{track_id}/lessons (API Spec §6): lista as
// lições da trilha com o progress_status do usuário autenticado embutido em cada item
// (not_started quando não existe user_progress ainda para aquela lição).
func handleListTrackLessons(mongoDB *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if mongoDB == nil {
			apierror.Write(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Banco de documentos indisponível.")
			return
		}

		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		trackID := r.PathValue("track_id")

		var t track
		err := mongoDB.Collection("tracks").FindOne(r.Context(), bson.M{"_id": trackID}).Decode(&t)
		if err == mongo.ErrNoDocuments {
			apierror.Write(w, http.StatusNotFound, "TRACK_NOT_FOUND", "Trilha inexistente ou sem acesso.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar trilha.")
			return
		}

		// Ordenação real vem de track.units (ver orderedLessonIDs) — a query em si não precisa
		// mais ordenar por _id, a reordenação acontece em memória logo abaixo.
		lessonsCur, err := mongoDB.Collection("lessons").Find(r.Context(), bson.M{"track_id": trackID})
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar lições.")
			return
		}
		defer lessonsCur.Close(r.Context())

		var lessons []lesson
		if err := lessonsCur.All(r.Context(), &lessons); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler lições.")
			return
		}
		byID := make(map[string]lesson, len(lessons))
		for _, l := range lessons {
			byID[l.ID] = l
		}

		progressByLesson, err := fetchProgressByLesson(r.Context(), mongoDB, userID, lessons)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar progresso.")
			return
		}

		// Percorre na ordem pedagógica real (track.units), não na ordem de retorno do Mongo.
		// Lições órfãs (existem no banco mas não estão em nenhuma unit) ficam de fora — a trilha
		// é quem define quais lições contam, não a coleção lessons isoladamente.
		orderedIDs := t.orderedLessonIDs()
		items := make([]lessonListItem, 0, len(orderedIDs))
		for i, id := range orderedIDs {
			l, ok := byID[id]
			if !ok {
				continue
			}
			l.Order = i + 1
			status, ok := progressByLesson[l.ID]
			if !ok {
				status = "not_started"
			}
			items = append(items, lessonListItem{Lesson: l, ProgressStatus: status})
		}

		writeJSON(w, http.StatusOK, map[string]any{"data": items})
	}
}

func fetchProgressByLesson(ctx context.Context, mongoDB *mongo.Database, userID string, lessons []lesson) (map[string]string, error) {
	result := map[string]string{}
	if len(lessons) == 0 {
		return result, nil
	}

	lessonIDs := make([]string, len(lessons))
	for i, l := range lessons {
		lessonIDs[i] = l.ID
	}

	cur, err := mongoDB.Collection("user_progress").Find(ctx, bson.M{
		"user_id":   userID,
		"lesson_id": bson.M{"$in": lessonIDs},
	})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var progresses []userProgressStatus
	if err := cur.All(ctx, &progresses); err != nil {
		return nil, err
	}
	for _, p := range progresses {
		result[p.LessonID] = p.Status
	}
	return result, nil
}

func encodeCursor(c cursorPayload) string {
	b, _ := json.Marshal(c)
	return base64.StdEncoding.EncodeToString(b)
}

func decodeCursor(s string) (cursorPayload, error) {
	var c cursorPayload
	b, err := base64.StdEncoding.DecodeString(s)
	if err != nil {
		return c, err
	}
	err = json.Unmarshal(b, &c)
	return c, err
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
