package learning

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
	"arqlearn/monolith/internal/gamification"
)

type answerRequest struct {
	SessionID  string `json:"session_id"`
	QuestionID string `json:"question_id"`
	Answer     string `json:"answer"`
	TimeMs     int    `json:"time_ms"`
}

// userProgressDoc espelha "user_progress" (Database Design §4.4) — granularidade por lição, não
// por pergunta (ver nota de simplificação em Database Design §4.4.1 sobre o SRS).
type userProgressDoc struct {
	ID           string    `bson:"_id"`
	UserID       string    `bson:"user_id"`
	LessonID     string    `bson:"lesson_id"`
	Status       string    `bson:"status"`
	CorrectCount int       `bson:"correct_count"`
	WrongCount   int       `bson:"wrong_count"`
	SRSState     srsBSON   `bson:"srs_state"`
	UpdatedAt    time.Time `bson:"updated_at"`
}

type srsBSON struct {
	EaseFactor   float64   `bson:"ease_factor"`
	IntervalDays int       `bson:"interval_days"`
	NextReviewAt time.Time `bson:"next_review_at"`
}

// handleSubmitAnswer implementa POST /v1/lessons/{lesson_id}/answers (API Spec §6): aplica
// calcularXP/SRS/streak (TDD §3–§5) e persiste em Postgres (gamificação) e MongoDB (progresso).
func handleSubmitAnswer(pool *pgxpool.Pool, mongoDB *mongo.Database) http.HandlerFunc {
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
		lessonID := r.PathValue("lesson_id")

		var req answerRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			apierror.Write(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Corpo da requisição inválido.")
			return
		}

		var sess practiceSession
		err := mongoDB.Collection("practice_sessions").
			FindOne(r.Context(), bson.M{"_id": req.SessionID, "user_id": userID}).
			Decode(&sess)
		if err == mongo.ErrNoDocuments {
			apierror.Write(w, http.StatusNotFound, "SESSION_NOT_FOUND", "Sessão de prática inexistente.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar sessão.")
			return
		}
		now := time.Now().UTC()
		if now.After(sess.ExpiresAt) {
			apierror.Write(w, http.StatusGone, "SESSION_EXPIRED", "Sessão expirada por inatividade.")
			return
		}

		var q questionAnswerKey
		if err := mongoDB.Collection("questions").FindOne(r.Context(), bson.M{"_id": req.QuestionID}).Decode(&q); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar pergunta.")
			return
		}
		// req.Answer é o id da opção escolhida (ex.: "b"), não o texto — ver questionOption em
		// session.go. Compara contra o id derivado da posição de CorrectAnswer em Options.
		correct := req.Answer == q.correctOptionID()

		// --- Postgres: perfil + gamificação atuais ---
		var timezone string
		var xpTotal, xpToday, heartsCurrent, streakCurrent, streakBest int
		var xpTodayDate, streakLastActiveDate *time.Time
		err = pool.QueryRow(r.Context(), `
			SELECT u.timezone, g.xp_total, g.xp_today, g.xp_today_date, g.hearts_current,
			       g.streak_current, g.streak_best, g.streak_last_active_date
			FROM users u JOIN user_gamification g ON g.user_id = u.id
			WHERE u.id = $1
		`, userID).Scan(&timezone, &xpTotal, &xpToday, &xpTodayDate, &heartsCurrent,
			&streakCurrent, &streakBest, &streakLastActiveDate)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar perfil.")
			return
		}

		hojeLocal := gamification.HojeLocal(timezone, now)
		hojeLocalDate, _ := time.Parse("2006-01-02", hojeLocal)

		xpTodayDateStr := dateOrEmpty(xpTodayDate)
		xpToday = gamification.XPHojeAposReset(xpToday, xpTodayDateStr, hojeLocal)

		// --- MongoDB: progresso existente da lição (para is_first_completion e estado do SRS) ---
		var prevProgress userProgressDoc
		progressErr := mongoDB.Collection("user_progress").
			FindOne(r.Context(), bson.M{"user_id": userID, "lesson_id": lessonID}).
			Decode(&prevProgress)
		progressExists := progressErr == nil
		if progressErr != nil && progressErr != mongo.ErrNoDocuments {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar progresso.")
			return
		}

		isLastQuestion := len(sess.AnsweredQuestionIDs)+1 >= len(sess.QuestionIDs)
		isFirstCompletion := isLastQuestion && (!progressExists || prevProgress.Status != "completed")

		xpResult := gamification.CalcularXP(q.Difficulty, req.TimeMs, isFirstCompletion, correct, xpToday)

		newHearts := heartsCurrent
		if !correct && newHearts > 0 {
			newHearts--
		}

		streak := gamification.StreakState{Current: streakCurrent, Best: streakBest, LastActiveDate: dateOrEmpty(streakLastActiveDate)}
		if isFirstCompletion {
			streak = gamification.AtualizarStreak(streak, hojeLocal)
		}

		newXPTotal := xpTotal + xpResult.XPConcedido
		newXPToday := xpToday + xpResult.XPConcedido
		newLevel := gamification.Nivel(newXPTotal)

		var streakLastActiveParam any
		if streak.LastActiveDate != "" {
			d, _ := time.Parse("2006-01-02", streak.LastActiveDate)
			streakLastActiveParam = d
		}

		_, err = pool.Exec(r.Context(), `
			UPDATE user_gamification
			SET xp_total = $1, xp_today = $2, xp_today_date = $3, level = $4,
			    hearts_current = $5, streak_current = $6, streak_best = $7, streak_last_active_date = $8
			WHERE user_id = $9
		`, newXPTotal, newXPToday, hojeLocalDate, newLevel, newHearts,
			streak.Current, streak.Best, streakLastActiveParam, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar gamificação.")
			return
		}

		// --- MongoDB: SRS + status da lição (por lição, não por pergunta — ver Database Design §4.4.1) ---
		prevSRS := gamification.SRSState{EaseFactor: gamification.DefaultEaseFactor, IntervalDays: 0}
		if progressExists {
			prevSRS = gamification.SRSState{EaseFactor: prevProgress.SRSState.EaseFactor, IntervalDays: prevProgress.SRSState.IntervalDays}
		}
		newSRS := gamification.AtualizarSRS(prevSRS, q.Difficulty, req.TimeMs, correct)
		nextReviewAt := gamification.NextReviewAt(now, newSRS.IntervalDays)

		correctCount, wrongCount := 0, 0
		if progressExists {
			correctCount, wrongCount = prevProgress.CorrectCount, prevProgress.WrongCount
		}
		if correct {
			correctCount++
		} else {
			wrongCount++
		}
		status := "in_progress"
		if isLastQuestion {
			status = "completed"
		}

		_, err = mongoDB.Collection("user_progress").UpdateOne(r.Context(),
			bson.M{"user_id": userID, "lesson_id": lessonID},
			bson.M{
				// _id só é aplicado na inserção (nunca em update de doc existente — _id é
				// imutável) — formato "{user_id}_{lesson_id}" combina com o exemplo já
				// documentado em Database Design §4.4 ("uuid_user-lesson_1"), em vez de
				// deixar o Mongo gerar um ObjectID (que quebraria o decode para string).
				"$setOnInsert": bson.M{"_id": userID + "_" + lessonID},
				"$set": bson.M{
					"user_id":       userID,
					"lesson_id":     lessonID,
					"status":        status,
					"correct_count": correctCount,
					"wrong_count":   wrongCount,
					"srs_state": bson.M{
						"ease_factor":    newSRS.EaseFactor,
						"interval_days":  newSRS.IntervalDays,
						"next_review_at": nextReviewAt,
					},
					"updated_at": now,
				},
			},
			options.UpdateOne().SetUpsert(true),
		)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar progresso.")
			return
		}

		_, err = mongoDB.Collection("practice_sessions").UpdateOne(r.Context(),
			bson.M{"_id": sess.ID},
			bson.M{"$addToSet": bson.M{"answered_question_ids": req.QuestionID}},
		)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar sessão.")
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"correct":              correct,
			"xp_ganho":             xpResult.XPConcedido,
			"xp_daily_cap_reached": xpResult.DailyCapReached,
			"vidas_restantes":      newHearts,
			"streak_atual":         streak.Current,
			"explicacao":           q.Explanation,
		})
	}
}

func dateOrEmpty(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format("2006-01-02")
}
