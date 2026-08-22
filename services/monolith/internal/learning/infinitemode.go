package learning

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"math/rand"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
	"arqlearn/monolith/internal/gamification"
	"arqlearn/monolith/internal/notifications"
	"arqlearn/monolith/internal/questiongen"
)

// infiniteModeSessionTTL segue o mesmo padrão de sessionTTL (session.go) — sessão abandonada
// expira sozinha via índice TTL do Mongo, sem exigir um job de limpeza.
const infiniteModeSessionTTL = 30 * time.Minute

// infiniteModeSession espelha a coleção "infinite_mode_sessions" (nova — Modo Infinito nunca
// teve estado persistido antes, era 100% stub). shownQuestionIDs evita repetir pergunta na mesma
// sessão; TotalTimeMs acumula pra calcular avg_time_ms no fim (API Spec §6.1).
// IsReview (TDD §10.3): sessão de "Revisar agora" — Topic fica vazio ("" — sem tópico único, a
// fila cruza todos os tópicos já praticados) e o pool de perguntas vem de dueLessonIDsForUser em
// vez de lessonIDsForTopic.
type infiniteModeSession struct {
	ID                string    `bson:"_id"`
	UserID            string    `bson:"user_id"`
	Topic             string    `bson:"topic"`
	IsReview          bool      `bson:"is_review,omitempty"`
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

// dueLessonIDsForUser (TDD §10.3, "Revisar agora") coleta as lições cujo SRS já calculado
// (user_progress.srs_state.next_review_at, TDD §4 — atualizado a cada resposta de lição em
// answers.go, nunca consumido por nenhum código até esta mudança) está vencido — sem filtro de
// tópico: revisar é entre todos os tópicos já praticados, não só o tema selecionado no momento.
// Só existe user_progress pra lição já respondida ao menos uma vez em modo Lição — lição nunca
// tentada nunca aparece como "vencida", correto por definição, não é bug.
func dueLessonIDsForUser(ctx context.Context, mongoDB *mongo.Database, userID string) ([]string, error) {
	cur, err := mongoDB.Collection("user_progress").Find(ctx, bson.M{
		"user_id":                  userID,
		"srs_state.next_review_at": bson.M{"$lte": time.Now().UTC()},
	})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var docs []struct {
		LessonID string `bson:"lesson_id"`
	}
	if err := cur.All(ctx, &docs); err != nil {
		return nil, err
	}
	ids := make([]string, 0, len(docs))
	for _, d := range docs {
		ids = append(ids, d.LessonID)
	}
	return ids, nil
}

// goldilocksMin/goldilocksMax (TDD §10) delimitam a faixa de probabilidade de acerto esperada
// ("nem fácil demais, nem difícil demais") usada por bandByExpectedDifficulty — banda, não só as
// 2 dificuldades mais próximas de 50%: um corte rígido demais esgota pool fino (tópico curado com
// poucas perguntas) mais rápido do que a seleção uniforme fazia antes desta mudança.
const goldilocksMin = 0.25
const goldilocksMax = 0.85

// minBandedCandidates: abaixo disso, bandByExpectedDifficulty devolve poucas opções demais pra
// valer a pena restringir — pickNextQuestion cai pro pool completo em vez de arriscar esgotar o
// tópico prematuramente.
const minBandedCandidates = 3

// bandByExpectedDifficulty filtra os candidatos pras dificuldades cuja probabilidade de acerto
// esperada pra skillScore (gamification.ProbabilidadeAcerto, TDD §10) cai dentro da faixa
// Goldilocks.
func bandByExpectedDifficulty(candidates []sessionQuestion, skillScore float64) []sessionQuestion {
	var banded []sessionQuestion
	for _, c := range candidates {
		p := gamification.ProbabilidadeAcerto(skillScore, c.Difficulty)
		if p >= goldilocksMin && p <= goldilocksMax {
			banded = append(banded, c)
		}
	}
	return banded
}

// pickNextQuestion sorteia uma pergunta aprovada do pool de lessonIDs, excluindo as já mostradas
// nesta sessão — nil (sem erro) quando o pool se esgota, que o chamador trata como fim natural da
// sessão (API Spec §6.1: "next_question ausente quando o banco de perguntas do tópico se esgota").
// skillScore (TDD §10) direciona a escolha pra perto do ponto Goldilocks quando adaptive e
// gamification.AdaptiveDifficultyEnabled estiverem ligados; adaptive=false (usado pela fila de
// revisão do SRS, TDD §10.3) ignora skillScore e sorteia uniforme no pool inteiro — o vencimento
// do SRS já é o sinal relevante ali, misturar com a banda Goldilocks seria complexidade sem
// ganho claro.
func pickNextQuestion(ctx context.Context, mongoDB *mongo.Database, lessonIDs, excludeIDs []string, skillScore float64, adaptive bool) (*sessionQuestion, error) {
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

	pool := candidates
	if adaptive && gamification.AdaptiveDifficultyEnabled {
		if banded := bandByExpectedDifficulty(candidates, skillScore); len(banded) >= minBandedCandidates {
			pool = banded
		}
	}
	q := pool[rand.Intn(len(pool))]
	return &q, nil
}

// startInfiniteModeRequest: Topic e Review (TDD §10.3) são mutuamente exclusivos — Review=true
// ignora Topic e monta o pool a partir de dueLessonIDsForUser (todos os tópicos já praticados).
type startInfiniteModeRequest struct {
	Topic  string `json:"topic"`
	Review bool   `json:"review"`
}

func handleStartInfiniteMode(pool *pgxpool.Pool, mongoDB *mongo.Database) http.HandlerFunc {
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

		var req startInfiniteModeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			apierror.Write(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Corpo da requisição inválido.")
			return
		}
		if !req.Review && req.Topic == "" {
			apierror.Write(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Corpo da requisição inválido.")
			return
		}

		var lessonIDs []string
		var skillScore float64
		var err error
		if req.Review {
			lessonIDs, err = dueLessonIDsForUser(r.Context(), mongoDB, userID)
			if err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar fila de revisão.")
				return
			}
			if len(lessonIDs) == 0 {
				apierror.Write(w, http.StatusNotFound, "REVIEW_QUEUE_EMPTY", "Nenhum item vencido pra revisar agora.")
				return
			}
		} else {
			lessonIDs, err = lessonIDsForTopic(r.Context(), mongoDB, req.Topic)
			if err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar trilhas do tópico.")
				return
			}
			// Best-effort (TDD §10): sem habilidade registrada ainda pro tópico, LoadTopicSkill
			// devolve (0, 0) — skillScore=0 é o âncora neutra de ProbabilidadeAcerto, então a
			// primeira pergunta da sessão já sai razoavelmente calibrada mesmo sem histórico.
			skillScore, _, err = gamification.LoadTopicSkill(r.Context(), pool, userID, req.Topic)
			if err != nil {
				log.Printf("aviso: falha ao carregar habilidade adaptativa (user_id=%s, topic=%s): %v", userID, req.Topic, err)
			}
		}

		question, err := pickNextQuestion(r.Context(), mongoDB, lessonIDs, nil, skillScore, !req.Review)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao sortear pergunta.")
			return
		}
		if question == nil {
			if req.Review {
				apierror.Write(w, http.StatusNotFound, "REVIEW_QUEUE_EMPTY", "Nenhum item vencido pra revisar agora.")
			} else {
				apierror.Write(w, http.StatusNotFound, "TOPIC_HAS_NO_QUESTIONS", "Nenhuma pergunta aprovada disponível para este tópico ainda.")
			}
			return
		}

		now := time.Now().UTC()
		sess := infiniteModeSession{
			ID:               uuid.NewString(),
			UserID:           userID,
			Topic:            req.Topic,
			IsReview:         req.Review,
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
			"is_review":  sess.IsReview,
			"question":   toWireQuestion(*question),
		})
	}
}

type infiniteModeAnswerRequest struct {
	QuestionID string `json:"question_id"`
	Answer     string `json:"answer"`
	TimeMs     int64  `json:"time_ms"`
}

// handleInfiniteModeAnswer concede XP igual a uma resposta normal (gamification.CalcularXP) e,
// desde 21/08/2026 (decisão do usuário — Modo Infinito "também é aceito" pra streak), também
// avança a sequência a cada resposta certa, mesmo padrão de internal/learning/answers.go. Segue
// sem tocar vidas/SRS/user_progress — Modo Infinito não é lição específica (API Spec §6.1,
// resposta não inclui vidas_restantes).
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
		var xpTotal, xpToday, xpDayBest, chestQuestionsToday, chestWeeklyQuestions int
		var xpTodayDate, chestQuestionsDate, chestClaimedDate, chestWeeklyCycleStart *time.Time
		var isVip bool
		var vipExpiresAt *time.Time
		var xpBoostActiveUntil *time.Time
		var streakCurrent, streakBest, streakFreezesAvailable int
		var streakLastActiveDate *time.Time
		var streakRepairValue *int
		var streakRepairDeadline *time.Time
		if err := pool.QueryRow(r.Context(), `
			SELECT u.timezone, g.xp_total, g.xp_today, g.xp_today_date, g.xp_day_best,
			       g.chest_questions_today, g.chest_questions_date, g.chest_claimed_date,
			       g.chest_weekly_questions, g.chest_weekly_cycle_start, g.is_vip, g.vip_expires_at,
			       g.xp_boost_active_until, g.streak_current, g.streak_best,
			       g.streak_last_active_date, g.streak_freezes_available,
			       g.streak_repair_value, g.streak_repair_deadline
			FROM users u JOIN user_gamification g ON g.user_id = u.id
			WHERE u.id = $1
		`, userID).Scan(&timezone, &xpTotal, &xpToday, &xpTodayDate, &xpDayBest,
			&chestQuestionsToday, &chestQuestionsDate, &chestClaimedDate,
			&chestWeeklyQuestions, &chestWeeklyCycleStart, &isVip, &vipExpiresAt,
			&xpBoostActiveUntil, &streakCurrent, &streakBest,
			&streakLastActiveDate, &streakFreezesAvailable,
			&streakRepairValue, &streakRepairDeadline); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar perfil.")
			return
		}

		now := time.Now().UTC()
		hojeLocal := gamification.HojeLocal(timezone, now)
		xpToday = gamification.XPHojeAposReset(xpToday, dateOrEmpty(xpTodayDate), hojeLocal)

		// Streak (mesmo padrão de internal/learning/answers.go — expira ANTES de aplicar o
		// incremento de hoje, repara/avança só em resposta certa; AtualizarStreak é idempotente
		// por dia, então acertar várias perguntas no mesmo dia não dá streak em dobro).
		streakBeforeExpiry := streakCurrent
		freezesBeforeExpiry := streakFreezesAvailable
		var novaLastActiveStr string
		var expirou bool
		streakCurrent, novaLastActiveStr, streakFreezesAvailable, expirou = gamification.AplicarExpiracaoStreak(
			streakCurrent, dateOrEmpty(streakLastActiveDate), streakFreezesAvailable, hojeLocal)

		streakJustReset := expirou && streakBeforeExpiry > 0
		freezeJustConsumed := !expirou && streakFreezesAvailable < freezesBeforeExpiry
		if streakJustReset && !correct {
			rv, rd := gamification.PrepararReparoStreak(streakBeforeExpiry, hojeLocal)
			deadline, _ := time.Parse("2006-01-02", rd)
			streakRepairValue = &rv
			streakRepairDeadline = &deadline
		}

		streak := gamification.StreakState{Current: streakCurrent, Best: streakBest, LastActiveDate: novaLastActiveStr}
		var streakRepaired bool
		if correct {
			if streakRepairValue != nil && streakRepairDeadline != nil {
				deadlineStr := streakRepairDeadline.Format("2006-01-02")
				if novoStreak, reparado := gamification.AplicarReparoStreak(streak, *streakRepairValue, deadlineStr, hojeLocal); reparado {
					streak = novoStreak
					streakRepaired = true
				} else {
					streak = gamification.AtualizarStreak(streak, hojeLocal)
				}
				streakRepairValue = nil
				streakRepairDeadline = nil
			} else {
				streak = gamification.AtualizarStreak(streak, hojeLocal)
			}
		}
		var streakLastActiveParam any
		if streak.LastActiveDate != "" {
			d, _ := time.Parse("2006-01-02", streak.LastActiveDate)
			streakLastActiveParam = d
		}

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
		// comboMaximo=0, isLastQuestion=false: Modo Infinito é prática solta, sem conceito de
		// "última pergunta da sessão" (não termina, só é abandonado/expira) — nunca recebe o
		// bônus de combo (TDD §3.0.1). Antes desta mudança (v1.4) recebia o bônus de velocidade
		// antigo por resposta rápida; perde esse bônus e não ganha um substituto — Modo Infinito
		// é farm-friendly por natureza (repetível, sem vidas/streak em jogo), então não faz
		// sentido também lhe dar o bônus de topo de sessão.
		// boostAtivo (TDD §3.3), diferente do combo acima, APLICA aqui igual a vipAtivo: o teto
		// diário não é elevado por boost, só alcançado mais rápido — mesma blindagem que já vale
		// pro VIP, farm ilimitado não vira XP ilimitado.
		boostAtivo := gamification.XPBoostAtivo(xpBoostActiveUntil, now)
		xpResult := gamification.CalcularXP(q.Difficulty, 0, false, false, correct, xpToday, vipAtivo, boostAtivo)
		newXPTotal := xpTotal + xpResult.XPConcedido
		newXPToday := xpToday + xpResult.XPConcedido
		newLevel := gamification.Nivel(newXPTotal)

		// Personal Record de "mais XP em um dia" (gamification.PersonalRecordXPDia) — mesmo padrão
		// de internal/learning/answers.go: calculado aqui pra ir no mesmo UPDATE de xp_total/
		// xp_today logo abaixo, sem round-trip extra ao banco.
		newXPDayBest, xpDayRecordBroken := gamification.DetectRecord(xpDayBest, newXPToday)

		hojeLocalDate, _ := time.Parse("2006-01-02", hojeLocal)

		// Habilidade adaptativa (TDD §10): não se aplica à fila de revisão (TDD §10.3) — sem
		// tópico único pra atualizar, e o vencimento do SRS já é o sinal relevante ali. Atualizada
		// ANTES de escolher a próxima pergunta, pra next_question desta mesma resposta já refletir
		// o novo skill_score — por isso roda aqui (não "depois do tx.Commit()" como
		// AddWeeklyXP/RecordEvent mais abaixo, que não afetam o corpo da resposta). Best-effort de
		// qualquer forma: uma falha aqui não derruba a resposta nem impede a próxima pergunta, só
		// mantém a seleção com o skill anterior daquela vez.
		var skillScore float64
		if !sess.IsReview {
			skillScore, err = gamification.UpdateTopicSkill(r.Context(), pool, userID, sess.Topic, q.Difficulty, correct)
			if err != nil {
				log.Printf("aviso: falha ao atualizar habilidade adaptativa (user_id=%s, topic=%s): %v", userID, sess.Topic, err)
			}
		}

		var lessonIDs []string
		if sess.IsReview {
			lessonIDs, err = dueLessonIDsForUser(r.Context(), mongoDB, userID)
		} else {
			lessonIDs, err = lessonIDsForTopic(r.Context(), mongoDB, sess.Topic)
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar próximas perguntas.")
			return
		}
		nextQuestion, err := pickNextQuestion(r.Context(), mongoDB, lessonIDs, sess.ShownQuestionIDs, skillScore, !sess.IsReview)
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
		// Sessão de revisão não tem tópico único (TDD §10.3) — não faz sentido disparar geração
		// de lote pra um tópico específico ali.
		if !sess.IsReview {
			maybeTriggerGeneration(mongoDB, gemini, sess.Topic, newQuestionsAnswered)
		}

		// Conquistas do Modo Infinito (sequência sem errar, total de perguntas) — best-effort,
		// mesmo padrão de AddWeeklyXP acima. achievementsUnlocked/personalRecordsBroken alimentam
		// diretamente o `resp` abaixo (ainda não construído nesta altura da função, diferente de
		// internal/learning/answers.go) — aqui a resposta cacheada de idempotência já sai com os
		// dois campos corretos, sem o trade-off documentado lá.
		achievementsUnlocked := []string{}
		personalRecordsBroken := []gamification.PersonalRecord{}
		if xpDayRecordBroken {
			personalRecordsBroken = append(personalRecordsBroken, gamification.PersonalRecord{
				Metric: gamification.PersonalRecordXPDia, Value: newXPDayBest,
			})
		}
		if counters, err := gamification.BumpInfiniteAnswerCounters(r.Context(), pool, userID, correct); err != nil {
			log.Printf("aviso: falha ao atualizar contadores de conquista do Modo Infinito (user_id=%s): %v", userID, err)
		} else if unlocked, err := gamification.EvaluateAndUnlock(r.Context(), pool, userID, counters); err != nil {
			log.Printf("aviso: falha ao avaliar conquistas (user_id=%s): %v", userID, err)
		} else {
			achievementsUnlocked = append(achievementsUnlocked, unlocked...)
		}

		chestClaimedToday := dateOrEmpty(chestClaimedDate) == hojeLocal
		dailyChestAvailable := chestQuestionsToday >= gamification.ChestQuestionsRequired && !chestClaimedToday

		resp := map[string]any{
			"correct":                 correct,
			"xp_ganho":                xpResult.XPConcedido,
			"xp_daily_cap_reached":    xpResult.DailyCapReached,
			"xp_boost_active":         boostAtivo,
			"streak_atual":            streak.Current,
			"questions_answered":      newQuestionsAnswered,
			"correct_count":           sess.CorrectCount + boolToInt(correct),
			"level":                   newQuestionsAnswered/genBatchSize + 1,
			"daily_chest_available":   dailyChestAvailable,
			"daily_chest_questions":   chestQuestionsToday,
			"achievements_unlocked":   achievementsUnlocked,
			"personal_records_broken": personalRecordsBroken,
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
			    chest_weekly_questions = $7, chest_weekly_cycle_start = $8,
			    streak_current = $9, streak_best = $10, streak_last_active_date = $11,
			    streak_freezes_available = $12, streak_repair_value = $13, streak_repair_deadline = $14,
			    xp_day_best = $15
			WHERE user_id = $16
		`, newXPTotal, newXPToday, hojeLocalDate, newLevel, chestQuestionsToday, hojeLocalDate,
			chestWeeklyQuestions, chestWeeklyCycleStartDate,
			streak.Current, streak.Best, streakLastActiveParam, streakFreezesAvailable,
			streakRepairValue, streakRepairDeadline, newXPDayBest, userID); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar gamificação.")
			return
		}

		// string(respJSON): mesmo achado de answers.go — []byte cru vira bytea em
		// QueryExecModeSimpleProtocol, rejeitado por uma coluna JSONB.
		if _, err := tx.Exec(r.Context(), `
			INSERT INTO answer_submissions (id, user_id, session_id, question_id, idempotency_key, response)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, uuid.New(), userID, sessionID, req.QuestionID, idempotencyKey, string(respJSON)); err != nil {
			// Mesma corrida documentada em answers.go (achado ao vivo, 19/08/2026): devolve a
			// resposta já gravada pela requisição vencedora em vez de um 500 pra quem perdeu a
			// corrida da UNIQUE constraint.
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

		if err := gamification.AddWeeklyXP(r.Context(), pool, userID, xpResult.XPConcedido); err != nil {
			log.Printf("aviso: falha ao somar XP semanal de liga no Modo Infinito (user_id=%s): %v", userID, err)
		}

		// Eventos de telemetria (Fase 1 — Fundação, RT-02). Sem grafite_consumido/esgotado nem
		// sessao_concluida aqui: Modo Infinito não toca vidas e não tem "última pergunta" (é
		// prática solta, ver comentário do handler acima).
		gamification.RecordEvent(r.Context(), pool, userID, gamification.EventItemRespondido, nil, map[string]any{
			"topic": sess.Topic, "question_id": req.QuestionID, "correct": correct,
			"difficulty": q.Difficulty, "time_ms": req.TimeMs, "modo_infinito": true, "is_review": sess.IsReview,
		})
		if xpResult.XPConcedido > 0 {
			gamification.RecordEvent(r.Context(), pool, userID, gamification.EventXPCreditado, gamification.IntPtr(xpResult.XPConcedido), map[string]any{
				"topic": sess.Topic, "daily_cap_reached": xpResult.DailyCapReached, "modo_infinito": true, "is_review": sess.IsReview,
			})
		}

		// Telemetria de streak (RS-08, TDD §5.5) — mesmo bloco best-effort de answers.go.
		if streakJustReset {
			gamification.RecordEvent(r.Context(), pool, userID, gamification.EventStreakReset, gamification.IntPtr(streakBeforeExpiry), map[string]any{"topic": sess.Topic, "modo_infinito": true})
		} else if freezeJustConsumed {
			gamification.RecordEvent(r.Context(), pool, userID, gamification.EventStreakFreezeConsumed, nil, map[string]any{"topic": sess.Topic, "modo_infinito": true})
		}
		if streakRepaired {
			gamification.RecordEvent(r.Context(), pool, userID, gamification.EventStreakRepaired, gamification.IntPtr(streak.Current), map[string]any{"topic": sess.Topic, "modo_infinito": true})
			if err := notifications.Create(r.Context(), mongoDB, userID, "streak_repaired", fmt.Sprintf("Sua sequência de %d dias foi restaurada! Continue praticando pra mantê-la viva.", streak.Current)); err != nil {
				log.Printf("aviso: falha ao registrar notificação de reparo de streak (user_id=%s): %v", userID, err)
			}
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

// handleReviewSummary implementa GET /v1/review/summary (TDD §10.3): quantos itens estão vencidos
// agora pro usuário autenticado, entre todos os tópicos — alimenta o cliente decidir se mostra o
// card "Revisar agora" ANTES de tentar abrir uma sessão, mesmo padrão de daily_chest_available/
// weekly_chest_available (gamification.go).
func handleReviewSummary(mongoDB *mongo.Database) http.HandlerFunc {
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

		dueCount, err := mongoDB.Collection("user_progress").CountDocuments(r.Context(), bson.M{
			"user_id":                  userID,
			"srs_state.next_review_at": bson.M{"$lte": time.Now().UTC()},
		})
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar fila de revisão.")
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{"due_count": dueCount})
	}
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
