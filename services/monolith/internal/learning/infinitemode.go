package learning

import (
	"context"
	"encoding/json"
	"log"
	"math"
	"math/rand"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
	"arqlearn/monolith/internal/gamification"
	"arqlearn/monolith/internal/questiongen"
)

// infiniteModeSessionTTL segue o mesmo padrão de sessionTTL (session.go) — sessão abandonada
// expira sozinha via índice TTL do Mongo, sem exigir um job de limpeza.
const infiniteModeSessionTTL = 30 * time.Minute

// infiniteModeSession espelha a coleção "infinite_mode_sessions" (nova — Modo Infinito nunca
// teve estado persistido antes, era 100% stub). shownQuestionIDs evita repetir pergunta na mesma
// sessão; TotalTimeMs acumula pra calcular avg_time_ms no fim (API Spec §6.1).
type infiniteModeSession struct {
	ID                string    `bson:"_id"`
	UserID            string    `bson:"user_id"`
	Topic             string    `bson:"topic"`
	ShownQuestionIDs  []string  `bson:"shown_question_ids"`
	QuestionsAnswered int       `bson:"questions_answered"`
	CorrectCount      int       `bson:"correct_count"`
	TotalTimeMs       int64     `bson:"total_time_ms"`
	TotalXPEarned     int       `bson:"total_xp_earned"`
	CreatedAt         time.Time `bson:"created_at"`
	ExpiresAt         time.Time `bson:"expires_at"`
}

// lessonIDsForTopic reaproveita o mesmo pool curado de perguntas de todas as trilhas com aquele
// topic — decisão já registrada em Docs/PENDENCIAS_IA.md #7: Modo Infinito não gera pergunta
// dedicada, só mistura/repete o que já existe aprovado.
func lessonIDsForTopic(ctx context.Context, mongoDB *mongo.Database, topic string) ([]string, error) {
	cur, err := mongoDB.Collection("tracks").Find(ctx, bson.M{"topic": topic})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var tracks []track
	if err := cur.All(ctx, &tracks); err != nil {
		return nil, err
	}
	var ids []string
	for _, t := range tracks {
		ids = append(ids, t.orderedLessonIDs()...)
	}
	return ids, nil
}

// pickNextQuestion sorteia uma pergunta aprovada do pool de lessonIDs, excluindo as já mostradas
// nesta sessão — nil (sem erro) quando o pool se esgota, que o chamador trata como fim natural da
// sessão (API Spec §6.1: "next_question ausente quando o banco de perguntas do tópico se esgota").
func pickNextQuestion(ctx context.Context, mongoDB *mongo.Database, lessonIDs, excludeIDs []string) (*sessionQuestion, error) {
	if len(lessonIDs) == 0 {
		return nil, nil
	}
	filter := bson.M{
		"lesson_id":     bson.M{"$in": lessonIDs},
		"review_status": "approved",
	}
	if len(excludeIDs) > 0 {
		filter["_id"] = bson.M{"$nin": excludeIDs}
	}
	cur, err := mongoDB.Collection("questions").Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var candidates []sessionQuestion
	if err := cur.All(ctx, &candidates); err != nil {
		return nil, err
	}
	if len(candidates) == 0 {
		return nil, nil
	}
	q := candidates[rand.Intn(len(candidates))]
	return &q, nil
}

type startInfiniteModeRequest struct {
	Topic string `json:"topic"`
}

func handleStartInfiniteMode(mongoDB *mongo.Database) http.HandlerFunc {
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

		var req startInfiniteModeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Topic == "" {
			apierror.Write(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Corpo da requisição inválido.")
			return
		}

		lessonIDs, err := lessonIDsForTopic(r.Context(), mongoDB, req.Topic)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar trilhas do tópico.")
			return
		}
		question, err := pickNextQuestion(r.Context(), mongoDB, lessonIDs, nil)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao sortear pergunta.")
			return
		}
		if question == nil {
			apierror.Write(w, http.StatusNotFound, "TOPIC_HAS_NO_QUESTIONS", "Nenhuma pergunta aprovada disponível para este tópico ainda.")
			return
		}

		now := time.Now().UTC()
		sess := infiniteModeSession{
			ID:               uuid.NewString(),
			UserID:           userID,
			Topic:            req.Topic,
			ShownQuestionIDs: []string{question.ID},
			CreatedAt:        now,
			ExpiresAt:        now.Add(infiniteModeSessionTTL),
		}
		if _, err := mongoDB.Collection("infinite_mode_sessions").InsertOne(r.Context(), sess); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao criar sessão.")
			return
		}

		writeJSON(w, http.StatusCreated, map[string]any{
			"session_id": sess.ID,
			"topic":      sess.Topic,
			"question":   toWireQuestion(*question),
		})
	}
}

type infiniteModeAnswerRequest struct {
	QuestionID string `json:"question_id"`
	Answer     string `json:"answer"`
	TimeMs     int64  `json:"time_ms"`
}

// handleInfiniteModeAnswer concede XP igual a uma resposta normal (gamification.CalcularXP),
// mas sem tocar vidas/streak/SRS/user_progress — Modo Infinito é prática solta, não faz parte do
// progresso de nenhuma lição específica (API Spec §6.1, resposta não inclui vidas_restantes).
func handleInfiniteModeAnswer(pool *pgxpool.Pool, mongoDB *mongo.Database, gemini *questiongen.Client) http.HandlerFunc {
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
		sessionID := r.PathValue("session_id")

		// Idempotency-Key (API Spec §2.6) — mesmo achado/mesmo fix de internal/learning/answers.go:
		// sem isto, um retry de rede concedia XP/baú/conquista de novo pra mesma resposta.
		idempotencyKey := r.Header.Get("Idempotency-Key")
		if idempotencyKey == "" {
			apierror.Write(w, http.StatusBadRequest, "IDEMPOTENCY_KEY_REQUIRED", "Cabeçalho Idempotency-Key é obrigatório.")
			return
		}

		var req infiniteModeAnswerRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			apierror.Write(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Corpo da requisição inválido.")
			return
		}

		if cachedResponse, err := lookupCachedAnswer(r, pool, idempotencyKey, userID); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao verificar idempotência.")
			return
		} else if cachedResponse != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(cachedResponse)
			return
		}

		var sess infiniteModeSession
		err := mongoDB.Collection("infinite_mode_sessions").FindOne(r.Context(),
			bson.M{"_id": sessionID, "user_id": userID}).Decode(&sess)
		if err == mongo.ErrNoDocuments {
			apierror.Write(w, http.StatusNotFound, "SESSION_NOT_FOUND", "Sessão de Modo Infinito inexistente.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar sessão.")
			return
		}

		var q questionAnswerKey
		if err := mongoDB.Collection("questions").FindOne(r.Context(), bson.M{"_id": req.QuestionID}).Decode(&q); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar pergunta.")
			return
		}
		correct := req.Answer == q.correctOptionID()

		var timezone string
		var xpTotal, xpToday, chestQuestionsToday, chestWeeklyQuestions int
		var xpTodayDate, chestQuestionsDate, chestClaimedDate, chestWeeklyCycleStart *time.Time
		var isVip bool
		var vipExpiresAt *time.Time
		if err := pool.QueryRow(r.Context(), `
			SELECT u.timezone, g.xp_total, g.xp_today, g.xp_today_date,
			       g.chest_questions_today, g.chest_questions_date, g.chest_claimed_date,
			       g.chest_weekly_questions, g.chest_weekly_cycle_start, g.is_vip, g.vip_expires_at
			FROM users u JOIN user_gamification g ON g.user_id = u.id
			WHERE u.id = $1
		`, userID).Scan(&timezone, &xpTotal, &xpToday, &xpTodayDate,
			&chestQuestionsToday, &chestQuestionsDate, &chestClaimedDate,
			&chestWeeklyQuestions, &chestWeeklyCycleStart, &isVip, &vipExpiresAt); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar perfil.")
			return
		}

		now := time.Now().UTC()
		hojeLocal := gamification.HojeLocal(timezone, now)
		xpToday = gamification.XPHojeAposReset(xpToday, dateOrEmpty(xpTodayDate), hojeLocal)

		// Baú Diário: Modo Infinito também conta pro total acumulado do dia (10 acertos em qualquer
		// combinação de lição/Modo Infinito), mesmo padrão de internal/learning/answers.go — só
		// respostas certas contam (mudou de "toda resposta" em 18/08/2026, ver comentário lá).
		chestQuestionsToday = gamification.QuestoesHojeAposReset(chestQuestionsToday, dateOrEmpty(chestQuestionsDate), hojeLocal)
		if correct {
			chestQuestionsToday++
		}

		// Baú Semanal: mesma regra do Baú Diário acima (só acertos), mesmo padrão de answers.go.
		var chestWeeklyCycleStartStr string
		chestWeeklyQuestions, chestWeeklyCycleStartStr = gamification.QuestoesSemanaAposReset(chestWeeklyQuestions, dateOrEmpty(chestWeeklyCycleStart), hojeLocal)
		if correct {
			chestWeeklyQuestions++
		}
		chestWeeklyCycleStartDate, _ := time.Parse("2006-01-02", chestWeeklyCycleStartStr)

		vipAtivo := gamification.EhVIPAtivo(isVip, vipExpiresAt, now)
		xpResult := gamification.CalcularXP(q.Difficulty, int(req.TimeMs), false, correct, xpToday, vipAtivo)
		newXPTotal := xpTotal + xpResult.XPConcedido
		newXPToday := xpToday + xpResult.XPConcedido
		newLevel := gamification.Nivel(newXPTotal)

		hojeLocalDate, _ := time.Parse("2006-01-02", hojeLocal)

		lessonIDs, err := lessonIDsForTopic(r.Context(), mongoDB, sess.Topic)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar trilhas do tópico.")
			return
		}
		nextQuestion, err := pickNextQuestion(r.Context(), mongoDB, lessonIDs, sess.ShownQuestionIDs)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao sortear próxima pergunta.")
			return
		}

		update := bson.M{
			"$inc": bson.M{
				"questions_answered": 1,
				"total_time_ms":      req.TimeMs,
				"total_xp_earned":    xpResult.XPConcedido,
			},
		}
		if correct {
			update["$inc"].(bson.M)["correct_count"] = 1
		}
		if nextQuestion != nil {
			update["$addToSet"] = bson.M{"shown_question_ids": nextQuestion.ID}
		}
		if _, err := mongoDB.Collection("infinite_mode_sessions").UpdateOne(r.Context(),
			bson.M{"_id": sessionID}, update); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar sessão.")
			return
		}

		newQuestionsAnswered := sess.QuestionsAnswered + 1
		maybeTriggerGeneration(mongoDB, gemini, sess.Topic, newQuestionsAnswered)

		// Conquistas do Modo Infinito (sequência sem errar, total de perguntas) — best-effort,
		// mesmo padrão de AddWeeklyXP acima.
		if counters, err := gamification.BumpInfiniteAnswerCounters(r.Context(), pool, userID, correct); err != nil {
			log.Printf("aviso: falha ao atualizar contadores de conquista do Modo Infinito (user_id=%s): %v", userID, err)
		} else if _, err := gamification.EvaluateAndUnlock(r.Context(), pool, userID, counters); err != nil {
			log.Printf("aviso: falha ao avaliar conquistas (user_id=%s): %v", userID, err)
		}

		chestClaimedToday := dateOrEmpty(chestClaimedDate) == hojeLocal
		dailyChestAvailable := chestQuestionsToday >= gamification.ChestQuestionsRequired && !chestClaimedToday

		resp := map[string]any{
			"correct":               correct,
			"xp_ganho":              xpResult.XPConcedido,
			"xp_daily_cap_reached":  xpResult.DailyCapReached,
			"questions_answered":    newQuestionsAnswered,
			"correct_count":         sess.CorrectCount + boolToInt(correct),
			"level":                 newQuestionsAnswered/genBatchSize + 1,
			"daily_chest_available": dailyChestAvailable,
			"daily_chest_questions": chestQuestionsToday,
		}
		if nextQuestion != nil {
			resp["next_question"] = toWireQuestion(*nextQuestion)
		}
		respJSON, err := json.Marshal(resp)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao montar resposta.")
			return
		}

		// UPDATE + registro da idempotency key na mesma transação — mesmo padrão de
		// internal/learning/answers.go (achado equivalente, mesmo fix).
		tx, err := pool.Begin(r.Context())
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar gamificação.")
			return
		}
		defer tx.Rollback(r.Context())

		if _, err := tx.Exec(r.Context(), `
			UPDATE user_gamification
			SET xp_total = $1, xp_today = $2, xp_today_date = $3, level = $4,
			    chest_questions_today = $5, chest_questions_date = $6,
			    chest_weekly_questions = $7, chest_weekly_cycle_start = $8
			WHERE user_id = $9
		`, newXPTotal, newXPToday, hojeLocalDate, newLevel, chestQuestionsToday, hojeLocalDate,
			chestWeeklyQuestions, chestWeeklyCycleStartDate, userID); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar gamificação.")
			return
		}

		if _, err := tx.Exec(r.Context(), `
			INSERT INTO answer_submissions (id, user_id, session_id, question_id, idempotency_key, response)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, uuid.New(), userID, sessionID, req.QuestionID, idempotencyKey, respJSON); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao registrar idempotência.")
			return
		}

		if err := tx.Commit(r.Context()); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar gamificação.")
			return
		}

		if err := gamification.AddWeeklyXP(r.Context(), pool, userID, xpResult.XPConcedido); err != nil {
			log.Printf("aviso: falha ao somar XP semanal de liga no Modo Infinito (user_id=%s): %v", userID, err)
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

func handleEndInfiniteMode(pool *pgxpool.Pool, mongoDB *mongo.Database) http.HandlerFunc {
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
		sessionID := r.PathValue("session_id")

		var sess infiniteModeSession
		err := mongoDB.Collection("infinite_mode_sessions").FindOne(r.Context(),
			bson.M{"_id": sessionID, "user_id": userID}).Decode(&sess)
		if err == mongo.ErrNoDocuments {
			apierror.Write(w, http.StatusNotFound, "SESSION_NOT_FOUND", "Sessão de Modo Infinito inexistente.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar sessão.")
			return
		}

		var accuracyRate float64
		var avgTimeMs int64
		if sess.QuestionsAnswered > 0 {
			// Percentual (0-100), não fração (0-1) — mesmo bug já corrigido em
			// progress.go#handleProgressSummary; o front só faz `${accuracy_rate}%` direto.
			accuracyRate = math.Round(float64(sess.CorrectCount) / float64(sess.QuestionsAnswered) * 100)
			avgTimeMs = sess.TotalTimeMs / int64(sess.QuestionsAnswered)

			// Só conta como "rodada" pra conquista de sessões se pelo menos 1 pergunta foi
			// respondida — encerrar uma sessão vazia não deveria valer ponto. Best-effort, mesmo
			// padrão dos outros hooks de conquista.
			if counters, err := gamification.BumpCounters(r.Context(), pool, userID, gamification.CounterDeltas{InfiniteSessions: 1}); err != nil {
				log.Printf("aviso: falha ao atualizar contador de sessões do Modo Infinito (user_id=%s): %v", userID, err)
			} else if _, err := gamification.EvaluateAndUnlock(r.Context(), pool, userID, counters); err != nil {
				log.Printf("aviso: falha ao avaliar conquistas (user_id=%s): %v", userID, err)
			}
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"questions_answered": sess.QuestionsAnswered,
			"correct_count":      sess.CorrectCount,
			"accuracy_rate":      accuracyRate,
			"xp_earned":          sess.TotalXPEarned,
			"avg_time_ms":        avgTimeMs,
		})
	}
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
