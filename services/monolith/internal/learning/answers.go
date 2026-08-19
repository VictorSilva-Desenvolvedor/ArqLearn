package learning

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
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

		// Idempotency-Key (API Spec §2.6) — mesmo padrão de handleShopPurchase
		// (internal/gamification/gamification.go): sem isto, um retry de rede reprocessava a
		// resposta inteira (XP, vidas, streak, baú e conquistas contados de novo), já que nada
		// aqui protegia contra duplicidade antes desta mudança.
		idempotencyKey := r.Header.Get("Idempotency-Key")
		if idempotencyKey == "" {
			apierror.Write(w, http.StatusBadRequest, "IDEMPOTENCY_KEY_REQUIRED", "Cabeçalho Idempotency-Key é obrigatório.")
			return
		}

		var req answerRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			apierror.Write(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Corpo da requisição inválido.")
			return
		}

		// Confere ANTES de qualquer efeito colateral — se a chave já foi usada, devolve a mesma
		// resposta gravada da primeira vez em vez de reprocessar.
		if cachedResponse, err := lookupCachedAnswer(r, pool, idempotencyKey, userID); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao verificar idempotência.")
			return
		} else if cachedResponse != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(cachedResponse)
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
		var xpTotal, xpToday, heartsCurrent, streakCurrent, streakBest, streakFreezesAvailable, chestQuestionsToday, chestWeeklyQuestions int
		var xpTodayDate, streakLastActiveDate, chestQuestionsDate, chestClaimedDate, chestWeeklyCycleStart *time.Time
		var heartsUpdatedAt time.Time
		var isVip bool
		var vipExpiresAt *time.Time
		err = pool.QueryRow(r.Context(), `
			SELECT u.timezone, g.xp_total, g.xp_today, g.xp_today_date, g.hearts_current, g.hearts_updated_at,
			       g.streak_current, g.streak_best, g.streak_last_active_date, g.streak_freezes_available,
			       g.chest_questions_today, g.chest_questions_date, g.chest_claimed_date,
			       g.chest_weekly_questions, g.chest_weekly_cycle_start, g.is_vip, g.vip_expires_at
			FROM users u JOIN user_gamification g ON g.user_id = u.id
			WHERE u.id = $1
		`, userID).Scan(&timezone, &xpTotal, &xpToday, &xpTodayDate, &heartsCurrent, &heartsUpdatedAt,
			&streakCurrent, &streakBest, &streakLastActiveDate, &streakFreezesAvailable,
			&chestQuestionsToday, &chestQuestionsDate, &chestClaimedDate,
			&chestWeeklyQuestions, &chestWeeklyCycleStart, &isVip, &vipExpiresAt)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar perfil.")
			return
		}
		// vipAtivo movido pra antes da regeneração de vidas (era calculado só mais abaixo, pro
		// XP) — RegenerarVidas agora também precisa saber (VIPHeartsRegenFactor).
		vipAtivo := gamification.EhVIPAtivo(isVip, vipExpiresAt, now)

		// Regenera antes de aplicar a resposta atual (TDD §5.4) — sem isso, alguém que voltou
		// depois de horas sem vidas perderia mais uma vida indevidamente por causa de um
		// contador desatualizado.
		heartsCurrent, heartsUpdatedAt = gamification.RegenerarVidas(heartsCurrent, heartsUpdatedAt, now, vipAtivo)

		hojeLocal := gamification.HojeLocal(timezone, now)
		hojeLocalDate, _ := time.Parse("2006-01-02", hojeLocal)

		xpTodayDateStr := dateOrEmpty(xpTodayDate)
		xpToday = gamification.XPHojeAposReset(xpToday, xpTodayDateStr, hojeLocal)

		// Baú Diário: conta só respostas CERTAS ("acertar 10 perguntas") pro contador acumulado do
		// dia, mesmo reset preguiçoso de xp_today. Mudou de "toda resposta, certa ou errada" pra
		// "só acertos" em 18/08/2026, a pedido do usuário, revertendo a decisão original de
		// 17/08/2026 (achada confusa em teste ao vivo em device real — ver
		// Docs/PENDENCIAS_TESTE_DEVICE.md). QuestoesHojeAposReset roda sempre (mesmo em resposta
		// errada) pra manter o reset de dia em dia certo; o incremento em si é condicional.
		// Incrementado ANTES de decidir daily_chest_available na resposta, pra essa própria
		// resposta (a que bate 10) já refletir o baú liberado, sem esperar a próxima leitura.
		chestQuestionsToday = gamification.QuestoesHojeAposReset(chestQuestionsToday, dateOrEmpty(chestQuestionsDate), hojeLocal)
		if correct {
			chestQuestionsToday++
		}

		// Baú Semanal: mesma regra do Baú Diário acima (só acertos) — QuestoesSemanaAposReset
		// decide se o ciclo vigente continua ou se um novo começa hoje, sempre; o incremento é
		// condicional a `correct`.
		var chestWeeklyCycleStartStr string
		chestWeeklyQuestions, chestWeeklyCycleStartStr = gamification.QuestoesSemanaAposReset(chestWeeklyQuestions, dateOrEmpty(chestWeeklyCycleStart), hojeLocal)
		if correct {
			chestWeeklyQuestions++
		}
		chestWeeklyCycleStartDate, _ := time.Parse("2006-01-02", chestWeeklyCycleStartStr)

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

		xpResult := gamification.CalcularXP(q.Difficulty, req.TimeMs, isFirstCompletion, correct, xpToday, vipAtivo)

		newHearts := heartsCurrent
		newHeartsUpdatedAt := heartsUpdatedAt
		if !correct && newHearts > 0 {
			// Só reinicia o relógio de regeneração se as vidas estavam CHEIAS (nenhum ciclo
			// rodando antes desta perda) — mudança a pedido do usuário, achado ao vivo
			// 19/08/2026: resetar sempre era injusto (ex.: faltavam 10s pra próxima vida, uma
			// resposta errada jogava de volta pros 36min inteiros, mesmo o ciclo já quase
			// terminado). Com um ciclo já em andamento, `heartsUpdatedAt` não muda — o tique já em
			// progresso continua contando pra chegar na próxima vida no horário original.
			if newHearts >= gamification.HeartsMax {
				newHeartsUpdatedAt = now
			}
			newHearts--
		}

		// Expira a streak (TDD §5.2/§5.3) ANTES de aplicar o incremento de hoje — sem isso, uma
		// streak_current desatualizada (ex.: 5 dias sem praticar) só seria incrementada em vez de
		// zerada primeiro, mesmo padrão de RegenerarVidas acima pras vidas.
		var novaLastActiveStr string
		streakCurrent, novaLastActiveStr, streakFreezesAvailable, _ = gamification.AplicarExpiracaoStreak(
			streakCurrent, dateOrEmpty(streakLastActiveDate), streakFreezesAvailable, hojeLocal)

		streak := gamification.StreakState{Current: streakCurrent, Best: streakBest, LastActiveDate: novaLastActiveStr}
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

		// Resposta final montada aqui — nada do que falta calcular (Mongo/conquistas abaixo)
		// altera estes campos, então já dá pra gravar como o payload cacheado da idempotency key.
		chestClaimedToday := dateOrEmpty(chestClaimedDate) == hojeLocal
		dailyChestAvailable := chestQuestionsToday >= gamification.ChestQuestionsRequired && !chestClaimedToday
		responseBody := map[string]any{
			"correct":               correct,
			"xp_ganho":              xpResult.XPConcedido,
			"xp_daily_cap_reached":  xpResult.DailyCapReached,
			"vidas_restantes":       newHearts,
			"streak_atual":          streak.Current,
			"explicacao":            q.Explanation,
			"daily_chest_available": dailyChestAvailable,
			"daily_chest_questions": chestQuestionsToday,
		}
		responseJSON, err := json.Marshal(responseBody)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao montar resposta.")
			return
		}

		// UPDATE + registro da idempotency key na MESMA transação (mesmo padrão de
		// handleShopPurchase) — a constraint UNIQUE em answer_submissions.idempotency_key é a
		// última linha de defesa contra uma corrida de dois retries concorrentes com a mesma
		// chave, além da checagem prévia já feita acima.
		tx, err := pool.Begin(r.Context())
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar gamificação.")
			return
		}
		defer tx.Rollback(r.Context())

		_, err = tx.Exec(r.Context(), `
			UPDATE user_gamification
			SET xp_total = $1, xp_today = $2, xp_today_date = $3, level = $4,
			    hearts_current = $5, hearts_updated_at = $6, streak_current = $7, streak_best = $8,
			    streak_last_active_date = $9, streak_freezes_available = $10,
			    chest_questions_today = $11, chest_questions_date = $12,
			    chest_weekly_questions = $13, chest_weekly_cycle_start = $14
			WHERE user_id = $15
		`, newXPTotal, newXPToday, hojeLocalDate, newLevel, newHearts, newHeartsUpdatedAt,
			streak.Current, streak.Best, streakLastActiveParam, streakFreezesAvailable,
			chestQuestionsToday, hojeLocalDate,
			chestWeeklyQuestions, chestWeeklyCycleStartDate, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar gamificação.")
			return
		}

		// string(responseJSON), não o []byte cru: o pool roda em QueryExecModeSimpleProtocol
		// (Supavisor, ver internal/db) e o encoder de protocolo simples do pgx manda um []byte
		// como literal bytea — Postgres rejeita isso pra uma coluna JSONB
		// ("invalid input syntax for type json", achado ao vivo 19/08/2026). Como string, vira
		// literal de texto, que o Postgres converte pra jsonb normalmente.
		_, err = tx.Exec(r.Context(), `
			INSERT INTO answer_submissions (id, user_id, session_id, question_id, idempotency_key, response)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, uuid.New(), userID, req.SessionID, req.QuestionID, idempotencyKey, string(responseJSON))
		if err != nil {
			// Corrida real entre dois retries concorrentes com a mesma chave (achado ao vivo,
			// 19/08/2026): a UNIQUE constraint pega a corrida, mas até aqui a requisição perdedora
			// recebia um 500 mesmo tendo a mesma resposta válida já gravada pela vencedora — o
			// usuário via erro numa ação que, na verdade, deu certo. `tx.Rollback` (deferred)
			// descarta o UPDATE desta transação perdedora, sem risco de XP em dobro; devolvemos a
			// resposta cacheada da vencedora em vez de um erro.
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				if cachedResponse, lookupErr := lookupCachedAnswer(r, pool, idempotencyKey, userID); lookupErr == nil && cachedResponse != nil {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusOK)
					_, _ = w.Write(cachedResponse)
					return
				}
			}
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao registrar idempotência.")
			return
		}

		if err := tx.Commit(r.Context()); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar gamificação.")
			return
		}

		// Não bloqueia a resposta se falhar — Liga é secundária ao XP/streak/vidas em si, que já
		// foram gravados acima. Só loga; o pior caso é o XP desta resposta não aparecer no
		// ranking semanal, não perder o XP de verdade (esse já está em user_gamification).
		if err := gamification.AddWeeklyXP(r.Context(), pool, userID, xpResult.XPConcedido); err != nil {
			log.Printf("aviso: falha ao somar XP semanal de liga (user_id=%s): %v", userID, err)
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

		// Conquistas (não bloqueia a resposta se falhar — mesmo padrão de AddWeeklyXP acima: XP/
		// vidas/streak já foram gravados de verdade, só a checagem de conquista é best-effort).
		// perfect_lessons_total só soma na conclusão de uma lição sem NENHUM erro registrado nela
		// (wrongCount ainda em 0 depois do incremento acima).
		perfectLesson := 0
		if isFirstCompletion && wrongCount == 0 {
			perfectLesson = 1
		}
		lessonCompleted := 0
		if isFirstCompletion {
			lessonCompleted = 1
		}
		answerCorrect := 0
		if correct {
			answerCorrect = 1
		}
		counters, err := gamification.BumpCounters(r.Context(), pool, userID, gamification.CounterDeltas{
			LessonsCompleted: lessonCompleted,
			AnswersCorrect:   answerCorrect,
			PerfectLessons:   perfectLesson,
		})
		if err != nil {
			log.Printf("aviso: falha ao atualizar contadores de conquista (user_id=%s): %v", userID, err)
		} else if _, err := gamification.EvaluateAndUnlock(r.Context(), pool, userID, counters); err != nil {
			log.Printf("aviso: falha ao avaliar conquistas (user_id=%s): %v", userID, err)
		}

		writeJSON(w, http.StatusOK, responseBody)
	}
}

// lookupCachedAnswer confere se idempotencyKey já foi processada por userID; devolve o corpo da
// resposta original (nil, nil se a chave é nova) sem tocar em nenhum efeito colateral.
func lookupCachedAnswer(r *http.Request, pool *pgxpool.Pool, idempotencyKey, userID string) ([]byte, error) {
	var response []byte
	err := pool.QueryRow(r.Context(), `
		SELECT response FROM answer_submissions WHERE idempotency_key = $1 AND user_id = $2
	`, idempotencyKey, userID).Scan(&response)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return response, nil
}

func dateOrEmpty(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format("2006-01-02")
}
