// Package expoclient envia push notifications via Expo Push API (Notifications Service, API Spec
// §9) — sem credencial própria de APNs/FCM: o Expo já gerencia isso pro projectId do app (mesmo
// critério "sem cartão de crédito" usado pra escolher Gemini/Groq, ver Docs/CLAUDE.md), então não
// há um Enabled()/API key aqui como em groqclient — o serviço é público e gratuito pra qualquer
// projeto Expo.
package expoclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const baseURL = "https://exp.host/--/api/v2/push/send"

// maxTokensPerRequest é o limite documentado da Expo Push API. Sem chunking aqui — fase bootstrap
// (5-20 usuários, Docs/CLAUDE.md) fica bem abaixo disso; se o volume crescer, SendPush precisa
// dividir `tokens` em lotes de até este tamanho antes de repetir a chamada.
const maxTokensPerRequest = 100

type Client struct {
	httpClient *http.Client
}

func New() *Client {
	return &Client{httpClient: &http.Client{Timeout: 20 * time.Second}}
}

type pushMessage struct {
	To    string         `json:"to"`
	Title string         `json:"title"`
	Body  string         `json:"body"`
	Data  map[string]any `json:"data,omitempty"`
}

type pushTicket struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Details *struct {
		Error string `json:"error"`
	} `json:"details"`
}

type pushResponse struct {
	Data  []pushTicket `json:"data"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// SendPush manda a mesma notificação (title/body/data) pra cada token em tokens — um token por
// ticket na resposta da Expo, na mesma ordem enviada. Erro por ticket individual (token inválido/
// desinstalado etc.) é logado por quem chama, não interrompe os demais — ver
// notifications.NotifyStreaksAtRisk, que já trata isso como best-effort por usuário.
func (c *Client) SendPush(ctx context.Context, tokens []string, title, body string, data map[string]any) error {
	if len(tokens) == 0 {
		return nil
	}
	if len(tokens) > maxTokensPerRequest {
		return fmt.Errorf("expoclient: %d tokens excede o limite de %d por request (chunking não implementado)", len(tokens), maxTokensPerRequest)
	}

	messages := make([]pushMessage, len(tokens))
	for i, token := range tokens {
		messages[i] = pushMessage{To: token, Title: title, Body: body, Data: data}
	}
	reqBody, err := json.Marshal(messages)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL, bytes.NewReader(reqBody))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("expoclient: requisição falhou: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	var parsed pushResponse
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return fmt.Errorf("expoclient: resposta inválida (status %d): %w", resp.StatusCode, err)
	}
	if parsed.Error != nil {
		return fmt.Errorf("expoclient: %s", parsed.Error.Message)
	}

	var failures []string
	for i, ticket := range parsed.Data {
		if ticket.Status != "ok" {
			detail := ticket.Message
			if ticket.Details != nil && ticket.Details.Error != "" {
				detail = ticket.Details.Error
			}
			tokenLabel := "token desconhecido"
			if i < len(tokens) {
				tokenLabel = tokens[i]
			}
			failures = append(failures, fmt.Sprintf("%s: %s", tokenLabel, detail))
		}
	}
	if len(failures) > 0 {
		return fmt.Errorf("expoclient: %d/%d tickets falharam: %v", len(failures), len(tokens), failures)
	}
	return nil
}
