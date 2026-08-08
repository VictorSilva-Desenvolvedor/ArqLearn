package learning

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
	"arqlearn/monolith/internal/groqclient"
)

type explainRequest struct {
	SelectedOptionID string `json:"selected_option_id"`
}

// explainQuestionDoc é a projeção de "questions" usada só por este handler — precisa de Prompt
// (que questionAnswerKey, em session.go, não carrega, pois não precisa para conferir a resposta).
type explainQuestionDoc struct {
	ID            string   `bson:"_id"`
	Prompt        string   `bson:"prompt"`
	Options       []string `bson:"options"`
	CorrectAnswer string   `bson:"correct_answer"`
	Explanation   string   `bson:"explanation"`
}

// explainSystemPrompt extrai só as regras operativas do Persona Prompt §5 relevantes a esta
// interação específica — não o documento inteiro, que seria desperdício de tokens numa chamada
// de baixa latência. Ver Docs/ArqLearn_IA_Persona_System_Prompt.md para o texto completo.
const explainSystemPrompt = `Você é Arq, tutor de IA do ArqLearn (Arquitetura e Urbanismo). O usuário já viu uma explicação
curta sobre uma pergunta que errou e pediu para "explicar melhor" (Persona Prompt §5). Responda em
português, tom técnico e direto, sem sermão. Aprofunde com um exemplo prático de projeto ou norma
quando fizer sentido, mantendo o registro técnico. Baseie-se exclusivamente na pergunta, na resposta
correta e na explicação curta fornecidas nesta mensagem — nunca invente norma, autor, data ou número
de artigo que não estejam nesse contexto; se precisar de algo que não foi fornecido, diga que não tem
essa informação em vez de inventar. Resposta em no máximo 4 frases.`

// handleExplainQuestion implementa POST /v1/lessons/{lesson_id}/questions/{question_id}/explain —
// aprofundamento sob demanda, distinto da explicação curta pré-gerada devolvida por
// POST .../answers (campo "explicacao", sem custo de IA por resposta errada — ver nota em
// Docs/CLAUDE.md sobre isso). Groq foi escolhido pela baixa latência: é uma chamada síncrona que
// o usuário está esperando.
func handleExplainQuestion(mongoDB *mongo.Database, groq *groqclient.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if mongoDB == nil {
			apierror.Write(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Serviço indisponível.")
			return
		}
		if !groq.Enabled() {
			apierror.Write(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Explicação aprofundada indisponível no momento.")
			return
		}
		if _, ok := authmiddleware.UserID(r.Context()); !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}
		questionID := r.PathValue("question_id")

		var req explainRequest
		_ = json.NewDecoder(r.Body).Decode(&req) // corpo é opcional (selected_option_id enriquece, não é obrigatório)

		var q explainQuestionDoc
		err := mongoDB.Collection("questions").FindOne(r.Context(), bson.M{"_id": questionID}).Decode(&q)
		if err == mongo.ErrNoDocuments {
			apierror.Write(w, http.StatusNotFound, "QUESTION_NOT_FOUND", "Pergunta inexistente.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar pergunta.")
			return
		}

		userPrompt := fmt.Sprintf(
			"Pergunta: %s\nResposta correta: %s\nExplicação curta já mostrada ao estudante: %s\n\nAprofunde essa explicação.",
			q.Prompt, q.CorrectAnswer, q.Explanation,
		)
		if req.SelectedOptionID != "" {
			if idx := int(req.SelectedOptionID[0] - 'a'); idx >= 0 && idx < len(q.Options) && q.Options[idx] != q.CorrectAnswer {
				userPrompt += fmt.Sprintf("\nO estudante respondeu \"%s\" (incorreto). Explique por que essa opção é tentadora mas errada.", q.Options[idx])
			}
		}

		ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
		defer cancel()
		deepExplanation, err := groq.Complete(ctx, explainSystemPrompt, userPrompt)
		if err != nil {
			apierror.Write(w, http.StatusBadGateway, "AI_PROVIDER_ERROR", "Falha ao gerar explicação aprofundada.")
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"deep_explanation": deepExplanation,
		})
	}
}
