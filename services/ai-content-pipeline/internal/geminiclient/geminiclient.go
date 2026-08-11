// Package geminiclient chama a API do Gemini (Google AI Studio) para o estágio 4 do pipeline
// (Geração de Perguntas via LLM, SAD §9.4) — escolhido por ler texto/imagem nativamente (útil
// pra PDF com foto/diagrama) e por ter saída JSON estruturada confiável via responseSchema.
package geminiclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	baseURL        = "https://generativelanguage.googleapis.com/v1beta/models"
	defaultModel   = "gemini-flash-lite-latest" // alias que o Google mantém apontado pro modelo lite atual — não fixar versão (2.5/3.1/... muda com frequência)
	embeddingModel = "gemini-embedding-001"
	embeddingDims  = 1536 // bate com content_chunks.embedding VECTOR(1536), Database Design §5
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

// GeneratedQuestion espelha o schema de geração do Persona Prompt §4, com source_ref achatado
// pra source_page (só texto por enquanto, sem vídeo — ver TODO em pipeline.go sobre timestamp_ms
// quando o estágio 2 do pipeline processar vídeo de verdade).
type GeneratedQuestion struct {
	Type          string   `json:"type"`
	Difficulty    string   `json:"difficulty"` // easy | medium | hard
	Prompt        string   `json:"prompt"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correct_answer"`
	Explanation   string   `json:"explanation"`
	SourcePage    int      `json:"source_page"`
	Confidence    string   `json:"confidence"` // high | medium | low
}

// systemPrompt extrai as regras operativas do Persona Prompt §4 (geração de perguntas) — o
// texto completo do documento fica em Docs/ArqLearn_IA_Persona_System_Prompt.md; aqui só o
// necessário pra esta chamada específica.
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
   uso (livro/apostila comercial digitalizado por inteiro), ou se o texto for insuficiente pra gerar
   pergunta de qualidade (curto demais, ilegível, fora do domínio de Arquitetura/Urbanismo), NÃO force
   a geração — devolva um array vazio [] em vez de inventar pergunta de baixo valor.`

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
			"source_page":    map[string]any{"type": "INTEGER"},
			"confidence":     map[string]any{"type": "STRING", "enum": []string{"high", "medium", "low"}},
		},
		"required": []string{"type", "difficulty", "prompt", "options", "correct_answer", "explanation", "source_page", "confidence"},
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

// GenerateQuestions pede N perguntas de um nível de dificuldade específico a partir de um
// texto-fonte (uma página ou trecho), seguindo o Persona Prompt §4. sourcePage é repassado no
// prompt pra o modelo ecoar de volta em cada pergunta (fonte de verdade pro rastreamento, não um
// valor confiável por si só — o chamador ainda deve conferir que bate com o texto realmente
// enviado). difficulty vazio deixa o modelo escolher livremente entre easy/medium/hard/impossible.
func (c *Client) GenerateQuestions(ctx context.Context, sourceText string, sourcePage, count int, difficulty string) ([]GeneratedQuestion, error) {
	if !c.Enabled() {
		return nil, fmt.Errorf("geminiclient: GEMINI_API_KEY não configurada")
	}

	difficultyInstruction := "easy, medium, hard ou impossible, conforme o critério da regra 5"
	if difficulty != "" {
		difficultyInstruction = fmt.Sprintf("todas de dificuldade %q", difficulty)
	}
	userPrompt := fmt.Sprintf(
		"Texto-fonte (página %d):\n\n%s\n\nGere %d perguntas de múltipla escolha (4 alternativas cada), %s, a partir exclusivamente deste texto.",
		sourcePage, sourceText, count, difficultyInstruction,
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
		return nil, fmt.Errorf("geminiclient: requisição falhou: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var parsed generateResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("geminiclient: resposta inválida (status %d): %w", resp.StatusCode, err)
	}
	if parsed.Error != nil {
		return nil, fmt.Errorf("geminiclient: %s", parsed.Error.Message)
	}
	if len(parsed.Candidates) == 0 || len(parsed.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("geminiclient: resposta sem candidates (status %d)", resp.StatusCode)
	}

	var questions []GeneratedQuestion
	if err := json.Unmarshal([]byte(parsed.Candidates[0].Content.Parts[0].Text), &questions); err != nil {
		return nil, fmt.Errorf("geminiclient: JSON de perguntas inválido: %w", err)
	}
	return questions, nil
}

type embedRequest struct {
	Model                string  `json:"model"`
	Content              content `json:"content"`
	OutputDimensionality int     `json:"outputDimensionality"`
}

type embedResponse struct {
	Embedding *struct {
		Values []float32 `json:"values"`
	} `json:"embedding"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// Embed gera o vetor de embedding de um chunk de texto (1 página, ver internal/pdfextract) pra
// gravar em content_chunks.embedding (Database Design §5, pgvector VECTOR(1536)) — confirmado ao
// vivo que outputDimensionality:1536 devolve exatamente 1536 valores em embedding.values.
func (c *Client) Embed(ctx context.Context, text string) ([]float32, error) {
	if !c.Enabled() {
		return nil, fmt.Errorf("geminiclient: GEMINI_API_KEY não configurada")
	}

	reqBody, err := json.Marshal(embedRequest{
		Model:                "models/" + embeddingModel,
		Content:              content{Parts: []part{{Text: text}}},
		OutputDimensionality: embeddingDims,
	})
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("%s/%s:embedContent?key=%s", baseURL, embeddingModel, c.apiKey)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(reqBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("geminiclient: requisição de embedding falhou: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var parsed embedResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("geminiclient: resposta de embedding inválida (status %d): %w", resp.StatusCode, err)
	}
	if parsed.Error != nil {
		return nil, fmt.Errorf("geminiclient: %s", parsed.Error.Message)
	}
	if parsed.Embedding == nil || len(parsed.Embedding.Values) != embeddingDims {
		return nil, fmt.Errorf("geminiclient: embedding com dimensão inesperada (esperado %d)", embeddingDims)
	}
	return parsed.Embedding.Values, nil
}

// Validate confere invariantes estruturais que o responseSchema NÃO garante — descoberto na
// prática: numa chamada de teste real, o modelo devolveu correct_answer com um texto que quase
// batia com uma das options, mas não exatamente (uma palavra a menos). Se isso for gravado como
// está, o backend (internal/learning, correctOptionID()) nunca vai achar qual opção é a correta
// — toda resposta do usuário seria avaliada como errada. Rodar isto sempre antes de aceitar
// output do modelo como publicável (SAD §9.5, Validação e Moderação).
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
	if q.Difficulty != "medium" && q.Difficulty != "hard" && q.Difficulty != "easy" && q.Difficulty != "impossible" {
		return fmt.Errorf("difficulty inválida: %q", q.Difficulty)
	}
	if q.Confidence != "high" && q.Confidence != "medium" && q.Confidence != "low" {
		return fmt.Errorf("confidence inválida: %q", q.Confidence)
	}
	return nil
}
