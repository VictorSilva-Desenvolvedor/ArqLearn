// Package questiongen chama o Gemini para gerar perguntas novas em segundo plano, alimentando o
// crescimento do Modo Infinito de Maquetes (Docs/PENDENCIAS_IA.md #7, decisão revisada 08/2026:
// deixou de ser "só reaproveita o pool existente" e passou a gerar lotes novos sob demanda,
// só para o tópico "maquetes" — único com texto-fonte real embutido, ver sourcetext/).
//
// Deliberadamente uma cópia adaptada de services/ai-content-pipeline/internal/geminiclient, não um
// import — são módulos Go separados sem dependência cruzada (mesma razão documentada em
// internal/groqclient, que já duplica o cliente Groq usado ali por outro motivo). Se uma regra do
// Persona Prompt §4 mudar, replicar a mudança nos dois lugares (ver Docs/CLAUDE.md).
package questiongen

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	baseURL      = "https://generativelanguage.googleapis.com/v1beta/models"
	defaultModel = "gemini-flash-lite-latest"
)

type Client struct {
	apiKey     string
	httpClient *http.Client
}

func New(apiKey string) *Client {
	return &Client{apiKey: apiKey, httpClient: &http.Client{Timeout: 60 * time.Second}}
}

func (c *Client) Enabled() bool {
	return c != nil && c.apiKey != ""
}

// GeneratedQuestion espelha geminiclient.GeneratedQuestion (ai-content-pipeline) — mesmo formato,
// pra reaproveitar o mesmo fluxo de persistência conceitual usado nos seeds de Maquetes.
type GeneratedQuestion struct {
	Type          string   `json:"type"`
	Difficulty    string   `json:"difficulty"`
	Prompt        string   `json:"prompt"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correct_answer"`
	Explanation   string   `json:"explanation"`
	Confidence    string   `json:"confidence"`
}

const systemPrompt = `Você é Arq, o motor de geração de perguntas do ArqLearn (Arquitetura e Urbanismo). Siga
estritamente estas regras (Persona Prompt §4):
1. Baseie-se exclusivamente no texto-fonte fornecido pelo usuário nesta mensagem.
2. Nunca alucine referências — não invente autor, norma, data ou número de artigo que não estejam
   literalmente no texto-fonte. Se o texto não permite afirmar algo com segurança, não gere a pergunta.
3. Uma única resposta correta inequívoca por pergunta — evite ambiguidade de interpretação.
4. Dificuldade (Persona Prompt §4.5): "easy" = definição direta do material; "medium" = aplicação
   de conceito; "hard" = síntese entre múltiplos trechos ou raciocínio crítico; "impossible" =
   conteúdo muito específico ou extremamente raro do trecho-fonte (um número exato, uma citação
   secundária, um detalhe isolado que exige leitura atenta), nunca inventado — se o texto não
   sustenta o detalhe com precisão, não gere como "impossible". Gere só o nível de dificuldade
   pedido nesta mensagem pelo usuário — não misture níveis na mesma chamada.
5. confidence "high" ou "medium" apenas quando a pergunta estiver solidamente ancorada no texto;
   se a única pergunta possível fosse de confidence "low", prefira não gerá-la.
6. type é sempre "multiple_choice" nesta chamada; explanation é curta (2-3 frases), citando o
   raciocínio a partir do trecho-fonte.
7. Se receber uma lista de perguntas já existentes para "não repetir", gere perguntas sobre fatos ou
   ângulos genuinamente diferentes desses — nunca uma paráfrase próxima de uma pergunta já existente.
   Se o texto-fonte já estiver esgotado (todo ângulo relevante já coberto pela lista), devolva um
   array vazio [] em vez de forçar repetição disfarçada.
8. Se o texto-fonte for insuficiente pra gerar pergunta de qualidade, NÃO force a geração — devolva
   um array vazio [] em vez de inventar pergunta de baixo valor.`

type generateRequest struct {
	SystemInstruction content          `json:"systemInstruction"`
	Contents          []content        `json:"contents"`
	GenerationConfig  generationConfig `json:"generationConfig"`
}

type content struct {
	Parts []part `json:"parts"`
}

type part struct {
	Text string `json:"text"`
}

type generationConfig struct {
	ResponseMimeType string `json:"responseMimeType"`
	ResponseSchema   any    `json:"responseSchema"`
}

var questionsArraySchema = map[string]any{
	"type": "ARRAY",
	"items": map[string]any{
		"type": "OBJECT",
		"properties": map[string]any{
			"type":           map[string]any{"type": "STRING", "enum": []string{"multiple_choice"}},
			"difficulty":     map[string]any{"type": "STRING", "enum": []string{"easy", "medium", "hard", "impossible"}},
			"prompt":         map[string]any{"type": "STRING"},
			"options":        map[string]any{"type": "ARRAY", "items": map[string]any{"type": "STRING"}},
			"correct_answer": map[string]any{"type": "STRING"},
			"explanation":    map[string]any{"type": "STRING"},
			"confidence":     map[string]any{"type": "STRING", "enum": []string{"high", "medium", "low"}},
		},
		"required": []string{"type", "difficulty", "prompt", "options", "correct_answer", "explanation", "confidence"},
	},
}

type generateResponse struct {
	Candidates []struct {
		Content struct {
			Parts []part `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// GenerateQuestions pede `count` perguntas de uma dificuldade específica a partir de sourceText,
// evitando repetir qualquer prompt listado em avoidPrompts (perguntas já existentes no banco pra
// este tópico — ver internal/learning/infinitemode_generation.go).
func (c *Client) GenerateQuestions(ctx context.Context, sourceText, difficulty string, count int, avoidPrompts []string) ([]GeneratedQuestion, error) {
	if !c.Enabled() {
		return nil, fmt.Errorf("questiongen: GEMINI_API_KEY não configurada")
	}

	avoidBlock := ""
	if len(avoidPrompts) > 0 {
		avoidBlock = "\n\nNÃO repita (nem parafraseie de forma muito próxima) nenhuma destas perguntas já existentes:\n- " +
			strings.Join(avoidPrompts, "\n- ")
	}
	userPrompt := fmt.Sprintf(
		"Texto-fonte:\n\n%s\n\nGere %d perguntas de múltipla escolha (4 alternativas cada), todas de dificuldade %q, a partir exclusivamente deste texto.%s",
		sourceText, count, difficulty, avoidBlock,
	)

	reqBody, err := json.Marshal(generateRequest{
		SystemInstruction: content{Parts: []part{{Text: systemPrompt}}},
		Contents:          []content{{Parts: []part{{Text: userPrompt}}}},
		GenerationConfig: generationConfig{
			ResponseMimeType: "application/json",
			ResponseSchema:   questionsArraySchema,
		},
	})
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("%s/%s:generateContent?key=%s", baseURL, defaultModel, c.apiKey)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(reqBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("questiongen: requisição falhou: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var parsed generateResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("questiongen: resposta inválida (status %d): %w", resp.StatusCode, err)
	}
	if parsed.Error != nil {
		return nil, fmt.Errorf("questiongen: %s", parsed.Error.Message)
	}
	if len(parsed.Candidates) == 0 || len(parsed.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("questiongen: resposta sem candidates (status %d)", resp.StatusCode)
	}

	var questions []GeneratedQuestion
	if err := json.Unmarshal([]byte(parsed.Candidates[0].Content.Parts[0].Text), &questions); err != nil {
		return nil, fmt.Errorf("questiongen: JSON de perguntas inválido: %w", err)
	}
	return questions, nil
}

// Validate confere os mesmos invariantes estruturais de geminiclient.Validate (ai-content-pipeline)
// — o responseSchema não garante que correct_answer bate exatamente com uma option (já visto na
// prática, ver comentário original). Nunca persistir uma pergunta sem passar por aqui antes.
func Validate(q GeneratedQuestion) error {
	if len(q.Options) < 2 {
		return fmt.Errorf("menos de 2 opções (%d)", len(q.Options))
	}
	seen := make(map[string]bool, len(q.Options))
	for _, opt := range q.Options {
		if seen[opt] {
			return fmt.Errorf("opção duplicada: %q", opt)
		}
		seen[opt] = true
	}
	if !seen[q.CorrectAnswer] {
		return fmt.Errorf("correct_answer (%q) não bate com nenhuma option exatamente", q.CorrectAnswer)
	}
	if q.Difficulty != "easy" && q.Difficulty != "medium" && q.Difficulty != "hard" && q.Difficulty != "impossible" {
		return fmt.Errorf("difficulty inválida: %q", q.Difficulty)
	}
	if q.Confidence != "high" && q.Confidence != "medium" && q.Confidence != "low" {
		return fmt.Errorf("confidence inválida: %q", q.Confidence)
	}
	return nil
}
