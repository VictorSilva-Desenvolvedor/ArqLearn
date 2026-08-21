package learning

import (
	"net/http"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
	"arqlearn/monolith/internal/gamification"
)

// sessionTTL casa com o prazo já documentado em SESSION_EXPIRED (API Spec §12) e com o índice
// TTL da coleção practice_sessions (Database Design §4.4.1).
const sessionTTL = 30 * time.Minute

// sessionQuestion é a projeção bson de "questions" ao iniciar uma sessão — nunca inclui
// correct_answer nem explanation (Persona Prompt §5: "nunca revele a resposta correta antes de
// o usuário responder"). Options crua (strings) só existe no servidor; ver optionID/toWireQuestion
// para o formato {id, label} enviado ao cliente.
type sessionQuestion struct {
	ID         string   `bson:"_id"`
	Type       string   `bson:"type"`
	Prompt     string   `bson:"prompt"`
	Options    []string `bson:"options"`
	Difficulty string   `bson:"difficulty"`
}

// questionOption é o formato de opção exposto na API (API Spec §6, Database Design §4.3
// addendum v1.7): id estável derivado da posição ("a", "b", "c"...), não o texto da opção — evita
// comparação de string literal na resposta (frágil a acento/maiúscula, ver TDD/CLAUDE.md) e não
// exige guardar um id por opção no banco além do que já existe.
type questionOption struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

// wireQuestion é o formato de pergunta enviado ao cliente (API Spec §6).
type wireQuestion struct {
	ID         string           `json:"id"`
	Type       string           `json:"type"`
	Prompt     string           `json:"prompt"`
	Options    []questionOption `json:"options"`
	Difficulty string           `json:"difficulty"`
}

// optionID deriva o id estável de uma opção pela posição: 0->"a", 1->"b", ... — mesma convenção
// usada nos fixtures mock do frontend (apps/web/src/lib/api/mocks/fixtures/questions.ts).
func optionID(index int) string {
	return string(rune('a' + index))
}

func toWireQuestion(q sessionQuestion) wireQuestion {
	opts := make([]questionOption, len(q.Options))
	for i, label := range q.Options {
		opts[i] = questionOption{ID: optionID(i), Label: label}
	}
	return wireQuestion{ID: q.ID, Type: q.Type, Prompt: q.Prompt, Options: opts, Difficulty: q.Difficulty}
}

// questionAnswerKey é a projeção mínima de "questions" usada em handleSubmitAnswer, à parte de
// sessionQuestion para deixar explícito onde correct_answer/explanation podem ser lidos.
type questionAnswerKey struct {
	ID            string   `bson:"_id"`
	Difficulty    string   `bson:"difficulty"`
	Options       []string `bson:"options"`
	CorrectAnswer string   `bson:"correct_answer"`
	Explanation   string   `bson:"explanation"`
}

// correctOptionID localiza, pela posição em Options, o id estável correspondente ao texto
// guardado em CorrectAnswer — é isso que handleSubmitAnswer compara contra req.Answer.
func (q questionAnswerKey) correctOptionID() string {
	for i, opt := range q.Options {
		if opt == q.CorrectAnswer {
			return optionID(i)
		}
	}
	return ""
}

// practiceSession espelha a coleção "practice_sessions" (Database Design §4.4.1). ComboAtual/
// ComboMaximo (TDD §3.0.1, v1.4): estado do bônus de combo — vive na sessão, não em
// user_gamification, porque zera a cada lição nova, nunca persiste entre sessões diferentes.
type practiceSession struct {
	ID                  string    `bson:"_id"`
	UserID              string    `bson:"user_id"`
	LessonID            string    `bson:"lesson_id"`
	QuestionIDs         []string  `bson:"question_ids"`
	AnsweredQuestionIDs []string  `bson:"answered_question_ids"`
	HeartsAtStart       int       `bson:"hearts_at_start"`
	ComboAtual          int       `bson:"combo_atual"`
	ComboMaximo         int       `bson:"combo_maximo"`
	CreatedAt           time.Time `bson:"created_at"`
	ExpiresAt           time.Time `bson:"expires_at"`
}

// handleStartSession implementa POST /v1/lessons/{lesson_id}/session (API Spec §6): monta a
// fila de perguntas da lição (ver nota de simplificação em Database Design §4.4.1 — ainda não
// prioriza por SRS vencido entre lições) e recusa se o usuário estiver sem vidas.
func handleStartSession(pool *pgxpool.Pool, mongoDB *mongo.Database) http.HandlerFunc {
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

		var l lesson
		err := mongoDB.Collection("lessons").FindOne(r.Context(), bson.M{"_id": lessonID}).Decode(&l)
		if err == mongo.ErrNoDocuments {
			apierror.Write(w, http.StatusNotFound, "LESSON_NOT_FOUND", "Lição inexistente.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar lição.")
			return
		}

		// LoadHeartsWithRegen (não um SELECT direto): aplica a regeneração preguiçosa antes do
		// gate de acesso (TDD §5.4) — sem isso, alguém que ficou horas sem vidas e já teria
		// regenerado continuaria vendo LESSON_NO_HEARTS_LEFT até o próximo GET /gamification/me.
		heartsCurrent, _, err := gamification.LoadHeartsWithRegen(r.Context(), pool, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar vidas.")
			return
		}
		if heartsCurrent <= 0 {
			apierror.Write(w, http.StatusConflict, "LESSON_NO_HEARTS_LEFT", "Você não possui vidas suficientes para continuar.")
			return
		}

		// review_status: "approved" — sem isso, uma pergunta ainda não revisada (gerada por IA,
		// ver ai-content-pipeline/cmd/generate-questions) apareceria numa sessão real como
		// qualquer outra. Ver Docs/CLAUDE.md.
		qcur, err := mongoDB.Collection("questions").Find(r.Context(), bson.M{
			"_id":           bson.M{"$in": l.QuestionIDs},
			"review_status": "approved",
		})
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar perguntas.")
			return
		}
		defer qcur.Close(r.Context())
		var questions []sessionQuestion
		if err := qcur.All(r.Context(), &questions); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler perguntas.")
			return
		}

		// Reordena pelo l.QuestionIDs — Find com $in não garante a ordem do array de entrada.
		byID := make(map[string]sessionQuestion, len(questions))
		for _, q := range questions {
			byID[q.ID] = q
		}
		wireQuestions := make([]wireQuestion, 0, len(l.QuestionIDs))
		for _, id := range l.QuestionIDs {
			if q, ok := byID[id]; ok {
				wireQuestions = append(wireQuestions, toWireQuestion(q))
			}
		}
		// Dificuldade ascendente (TDD §10) — fácil primeiro, difícil por último. SliceStable
		// preserva a ordem relativa entre perguntas empatadas na mesma dificuldade (a ordem
		// original de l.QuestionIDs continua desempatando).
		sort.SliceStable(wireQuestions, func(i, j int) bool {
			return gamification.DifficultyOrder[wireQuestions[i].Difficulty] < gamification.DifficultyOrder[wireQuestions[j].Difficulty]
		})

		now := time.Now().UTC()
		sess := practiceSession{
			ID:                  uuid.NewString(),
			UserID:              userID,
			LessonID:            lessonID,
			QuestionIDs:         l.QuestionIDs,
			AnsweredQuestionIDs: []string{},
			HeartsAtStart:       heartsCurrent,
			CreatedAt:           now,
			ExpiresAt:           now.Add(sessionTTL),
		}
		if _, err := mongoDB.Collection("practice_sessions").InsertOne(r.Context(), sess); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao criar sessão.")
			return
		}

		// Best-effort, não bloqueia a resposta (RecordEvent já não devolve erro, ver events.go).
		gamification.RecordEvent(r.Context(), pool, userID, gamification.EventSessaoIniciada, nil,
			map[string]any{"lesson_id": lessonID, "session_id": sess.ID, "question_count": len(wireQuestions)})

		writeJSON(w, http.StatusCreated, map[string]any{
			"session_id":       sess.ID,
			"questions":        wireQuestions,
			"hearts_available": heartsCurrent,
		})
	}
}
