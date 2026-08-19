// Package groqclient chama a API da Groq (compatível com o formato OpenAI de chat completions),
// usada para "explique melhor" (Persona Prompt §5) — baixa latência importa aqui porque é uma
// chamada síncrona disparada por um botão que o usuário está esperando responder.
package groqclient

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
	baseURL = "https://api.groq.com/openai/v1/chat/completions"
	// Achado ao vivo (19/08/2026): llama-3.3-70b-versatile não existe mais no catálogo da Groq
	// pra esta conta ("model_not_found") — Groq descontinua modelo sem aviso prévio no código.
	// Confirmado via GET /v1/models que o catálogo atual não tem nenhum Llama de chat; trocado
	// pro melhor equivalente disponível (openai/gpt-oss-120b, modelo aberto da OpenAI hospedado
	// na Groq) — testado ao vivo em português normal e em response_format:json_object (usado por
	// CompleteJSON), os dois funcionando. A resposta desse modelo vem com um campo extra
	// "reasoning" ao lado de "content" — chatMessage aqui só declara Content, então o decoder do
	// Go já ignora o campo extra sozinho, sem precisar de mudança de código pra isso.
	defaultModel = "openai/gpt-oss-120b"
)

type Client struct {
	apiKey     string
	httpClient *http.Client
}

func New(apiKey string) *Client {
	return &Client{apiKey: apiKey, httpClient: &http.Client{Timeout: 20 * time.Second}}
}

// Enabled reporta se há uma chave configurada — chamadores devem checar antes de usar, seguindo
// o mesmo padrão de fallback gracioso de internal/db e internal/documentdb (sem chave, a rota que
// depende disso responde 503 em vez de o processo cair).
func (c *Client) Enabled() bool {
	return c != nil && c.apiKey != ""
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type responseFormat struct {
	Type string `json:"type"`
}

type chatRequest struct {
	Model          string          `json:"model"`
	Messages       []chatMessage   `json:"messages"`
	ResponseFormat *responseFormat `json:"response_format,omitempty"`
}

type chatResponse struct {
	Choices []struct {
		Message chatMessage `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// Complete envia um system+user prompt e devolve o texto da resposta do modelo.
func (c *Client) Complete(ctx context.Context, systemPrompt, userPrompt string) (string, error) {
	return c.complete(ctx, systemPrompt, userPrompt, false)
}

// CompleteJSON é como Complete, mas força o modelo a responder com um objeto JSON válido
// (Groq aceita response_format:json_object no mesmo shape da OpenAI Chat Completions API,
// confirmado ao vivo). O prompt ainda precisa descrever o schema esperado — isso só garante que
// a saída *parseia* como JSON, não a forma exata dele.
func (c *Client) CompleteJSON(ctx context.Context, systemPrompt, userPrompt string) (string, error) {
	return c.complete(ctx, systemPrompt, userPrompt, true)
}

func (c *Client) complete(ctx context.Context, systemPrompt, userPrompt string, jsonMode bool) (string, error) {
	if !c.Enabled() {
		return "", fmt.Errorf("groqclient: GROQ_API_KEY não configurada")
	}

	chatReq := chatRequest{
		Model: defaultModel,
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
	}
	if jsonMode {
		chatReq.ResponseFormat = &responseFormat{Type: "json_object"}
	}
	reqBody, err := json.Marshal(chatReq)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL, bytes.NewReader(reqBody))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("groqclient: requisição falhou: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var parsed chatResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return "", fmt.Errorf("groqclient: resposta inválida (status %d): %w", resp.StatusCode, err)
	}
	if parsed.Error != nil {
		return "", fmt.Errorf("groqclient: %s", parsed.Error.Message)
	}
	if len(parsed.Choices) == 0 {
		return "", fmt.Errorf("groqclient: resposta sem choices (status %d)", resp.StatusCode)
	}
	return parsed.Choices[0].Message.Content, nil
}
