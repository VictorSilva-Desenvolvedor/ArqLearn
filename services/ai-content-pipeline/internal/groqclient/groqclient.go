// Package groqclient chama a API da Groq (compatível com o formato OpenAI de chat completions)
// como uma SEGUNDA fonte de geração de perguntas — provedor distinto de
// internal/geminiclient, mesma regra de negócio (Persona Prompt §4), pra diversificar o banco de
// questões sem depender de um único LLM. Não confundir com
// services/monolith/internal/groqclient, que é o cliente Groq usado pra "explique melhor"
// (Persona Prompt §5) — módulos Go separados, sem import cruzado possível, então este é uma
// segunda implementação enxuta, focada só em geração estruturada.
package groqclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"arqlearn/ai-content-pipeline/internal/geminiclient"
)

const (
	baseURL      = "https://api.groq.com/openai/v1/chat/completions"
	defaultModel = "llama-3.3-70b-versatile"
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

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Model          string        `json:"model"`
	Messages       []chatMessage `json:"messages"`
	ResponseFormat struct {
		Type string `json:"type"`
	} `json:"response_format"`
}

type chatResponse struct {
	Choices []struct {
		Message chatMessage `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// systemPrompt é o mesmo recorte operativo do Persona Prompt §4 usado em geminiclient.go — Groq
// não tem um recurso nativo de responseSchema equivalente ao do Gemini, então a mensagem pede
// explicitamente "somente JSON" e o parsing (parseQuestionsJSON) tolera cerca de markdown.
const systemPrompt = `Você é Arq, o motor de geração de perguntas do ArqLearn (Arquitetura e Urbanismo). Siga
estritamente estas regras (Persona Prompt §4):
1. Baseie-se exclusivamente no texto-fonte fornecido pelo usuário nesta mensagem.
2. Nunca alucine referências — não invente autor, norma, data ou número de artigo que não estejam
   literalmente no texto-fonte. Se o texto não permite afirmar algo com segurança, não gere a pergunta.
3. Toda pergunta deve indicar a página do texto-fonte de onde veio (source_page).
4. Uma única resposta correta inequívoca por pergunta — evite ambiguidade de interpretação.
5. Dificuldade (Persona Prompt §4.5): "easy" = definição direta do material; "medium" = aplicação
   de conceito; "hard" = síntese entre múltiplos trechos ou raciocínio crítico; "impossible" =
   conteúdo muito específico ou extremamente raro do trecho-fonte (um número exato, uma citação
   secundária, um detalhe isolado que exige leitura atenta), nunca inventado — se o texto não
   sustenta o detalhe com precisão, não gere como "impossible". Gere só o nível de dificuldade
   pedido nesta mensagem pelo usuário — não misture níveis na mesma chamada.
6. confidence "high" ou "medium" apenas quando a pergunta estiver solidamente ancorada no texto;
   se a única pergunta possível fosse de confidence "low", prefira não gerá-la.
7. type é sempre "multiple_choice" nesta chamada; explanation é curta (2-3 frases), citando o
   raciocínio a partir do trecho-fonte.
8. Se o texto-fonte parecer cópia integral de obra protegida de terceiros sem indício de direito de
   uso, ou se o texto for insuficiente pra gerar pergunta de qualidade, NÃO force a geração —
   devolva um array vazio [] em vez de inventar pergunta de baixo valor.
9. Responda SOMENTE com um array JSON válido, sem texto fora do JSON e sem cercas de markdown
   (nada de crase tripla), seguindo exatamente este schema por item:
   {"type":"multiple_choice","difficulty":"easy|medium|hard|impossible","prompt":"string","options":["string","string","string","string"],"correct_answer":"string (idêntico a uma das options)","explanation":"string","source_page":0,"confidence":"high|medium|low"}`

// GenerateQuestions espelha geminiclient.Client.GenerateQuestions — mesma assinatura e mesmo
// tipo de retorno (geminiclient.GeneratedQuestion), pra reaproveitar Validate() e o código de
// gravação no MongoDB em cmd/generate-questions sem duplicar nada além da chamada HTTP em si.
func (c *Client) GenerateQuestions(ctx context.Context, sourceText string, sourcePage, count int, difficulty string) ([]geminiclient.GeneratedQuestion, error) {
	if !c.Enabled() {
		return nil, fmt.Errorf("groqclient: GROQ_API_KEY não configurada")
	}

	difficultyInstruction := "easy, medium, hard ou impossible, conforme o critério da regra 5"
	if difficulty != "" {
		difficultyInstruction = fmt.Sprintf("todas de dificuldade %q", difficulty)
	}
	userPrompt := fmt.Sprintf(
		"Texto-fonte (página %d):\n\n%s\n\nGere %d perguntas de múltipla escolha (4 alternativas cada), %s, a partir exclusivamente deste texto.",
		sourcePage, sourceText, count, difficultyInstruction,
	)

	reqBody, err := json.Marshal(chatRequest{
		Model: defaultModel,
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		ResponseFormat: struct {
			Type string `json:"type"`
		}{Type: "json_object"},
	})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL, bytes.NewReader(reqBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("groqclient: requisição falhou: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var parsed chatResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("groqclient: resposta inválida (status %d): %w", resp.StatusCode, err)
	}
	if parsed.Error != nil {
		return nil, fmt.Errorf("groqclient: %s", parsed.Error.Message)
	}
	if len(parsed.Choices) == 0 {
		return nil, fmt.Errorf("groqclient: resposta sem choices (status %d)", resp.StatusCode)
	}

	return parseQuestionsJSON(parsed.Choices[0].Message.Content)
}

var codeFence = regexp.MustCompile("(?s)```(?:json)?\\s*(.*?)\\s*```")

// parseQuestionsJSON extrai o array de perguntas da resposta do Groq. Como response_format
// "json_object" exige um OBJETO json na raiz (não aceita array puro), pedimos pro modelo
// devolver um objeto e toleramos as formas mais prováveis: um array solto, ou um objeto com uma
// única chave cujo valor é o array (ex.: {"questions":[...]}) — a chave exata não é garantida
// pelo provedor, então pegamos o primeiro valor do tipo array em vez de fixar um nome.
func parseQuestionsJSON(raw string) ([]geminiclient.GeneratedQuestion, error) {
	text := strings.TrimSpace(raw)
	if m := codeFence.FindStringSubmatch(text); m != nil {
		text = strings.TrimSpace(m[1])
	}

	var asArray []geminiclient.GeneratedQuestion
	if err := json.Unmarshal([]byte(text), &asArray); err == nil {
		return asArray, nil
	}

	var asObject map[string]json.RawMessage
	if err := json.Unmarshal([]byte(text), &asObject); err != nil {
		return nil, fmt.Errorf("groqclient: JSON de perguntas inválido: %w", err)
	}
	for _, v := range asObject {
		var candidate []geminiclient.GeneratedQuestion
		if err := json.Unmarshal(v, &candidate); err == nil {
			return candidate, nil
		}
	}
	return nil, fmt.Errorf("groqclient: nenhum array de perguntas encontrado na resposta")
}
