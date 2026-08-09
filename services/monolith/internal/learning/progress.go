package learning

import (
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
)

// progressDoc é a projeção de "user_progress" (Database Design §4.4) necessária pro resumo —
// mais campos que userProgressStatus (learning.go), que só cobre o status por lição.
type progressDoc struct {
	LessonID     string    `bson:"lesson_id"`
	Status       string    `bson:"status"`
	CorrectCount int       `bson:"correct_count"`
	WrongCount   int       `bson:"wrong_count"`
	UpdatedAt    time.Time `bson:"updated_at"`
}

type progressSummaryResponse struct {
	TracksInProgress       int     `json:"tracks_in_progress"`
	TracksCompleted        int     `json:"tracks_completed"`
	LessonsCompletedLast7d int     `json:"lessons_completed_last_7d"`
	AccuracyRate           float64 `json:"accuracy_rate"`
}

// handleProgressSummary implementa GET /v1/progress/summary (API Spec §6): agrega
// "user_progress" (por lição) pra cima em "por trilha" (uma trilha conta como concluída só
// quando TODAS as lições dela, definidas por track.units — mesma fonte de verdade de
// orderedLessonIDs em learning.go — estão com status "completed").
func handleProgressSummary(mongoDB *mongo.Database) http.HandlerFunc {
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

		cur, err := mongoDB.Collection("user_progress").Find(r.Context(), bson.M{"user_id": userID})
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar progresso.")
			return
		}
		defer cur.Close(r.Context())

		var progresses []progressDoc
		if err := cur.All(r.Context(), &progresses); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler progresso.")
			return
		}

		var resp progressSummaryResponse
		if len(progresses) == 0 {
			writeJSON(w, http.StatusOK, resp)
			return
		}

		sevenDaysAgo := time.Now().UTC().AddDate(0, 0, -7)
		statusByLesson := make(map[string]string, len(progresses))
		var totalCorrect, totalWrong int
		for _, p := range progresses {
			statusByLesson[p.LessonID] = p.Status
			totalCorrect += p.CorrectCount
			totalWrong += p.WrongCount
			if p.Status == "completed" && p.UpdatedAt.After(sevenDaysAgo) {
				resp.LessonsCompletedLast7d++
			}
		}
		if totalCorrect+totalWrong > 0 {
			resp.AccuracyRate = float64(totalCorrect) / float64(totalCorrect+totalWrong)
		}

		lessonIDs := make([]string, 0, len(statusByLesson))
		for id := range statusByLesson {
			lessonIDs = append(lessonIDs, id)
		}
		lessonsCur, err := mongoDB.Collection("lessons").Find(r.Context(), bson.M{"_id": bson.M{"$in": lessonIDs}})
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar lições.")
			return
		}
		defer lessonsCur.Close(r.Context())
		var touchedLessons []lesson
		if err := lessonsCur.All(r.Context(), &touchedLessons); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler lições.")
			return
		}
		trackIDs := map[string]bool{}
		for _, l := range touchedLessons {
			trackIDs[l.TrackID] = true
		}

		for trackID := range trackIDs {
			var t track
			if err := mongoDB.Collection("tracks").FindOne(r.Context(), bson.M{"_id": trackID}).Decode(&t); err != nil {
				continue // trilha sumiu/renomeada — não deveria travar o resumo inteiro por isso
			}
			allLessonIDs := t.orderedLessonIDs()
			if len(allLessonIDs) == 0 {
				continue
			}
			allCompleted := true
			anyTouched := false
			for _, id := range allLessonIDs {
				status, touched := statusByLesson[id]
				if touched {
					anyTouched = true
				}
				if status != "completed" {
					allCompleted = false
				}
			}
			if allCompleted {
				resp.TracksCompleted++
			} else if anyTouched {
				resp.TracksInProgress++
			}
		}

		writeJSON(w, http.StatusOK, resp)
	}
}
