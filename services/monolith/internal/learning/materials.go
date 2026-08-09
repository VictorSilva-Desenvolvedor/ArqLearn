package learning

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
	"arqlearn/monolith/internal/groqclient"
)

// summarySystemPrompt condensa o Persona Prompt §6 (Resumo Inteligente) — só as regras
// operativas relevantes pra esta chamada, mesmo espírito de explainSystemPrompt (explain.go).
const summarySystemPrompt = `Você é Arq, tutor de IA do ArqLearn (Arquitetura e Urbanismo). Gere um resumo estruturado do
material abaixo, seguindo estas regras: (1) use exclusivamente o conteúdo fornecido — nunca
complete lacunas com conhecimento geral; se um tópico não está no material, não entra no resumo;
(2) responda em português, em JSON válido com exatamente estes campos: "title" (string, título
curto do material), "synopsis" (string, síntese de 1-2 frases), "key_points" (array de objetos
{"title": string, "explanation": string de 1-3 frases}), "architect_tip" (string com um insight
prático conectando conceitos do material, ou null se não fizer sentido); (3) a "dica do
arquiteto" nunca é uma opinião desconectada do material, sempre liga a algo que está no texto.`

// materialChatSystemPrompt condensa o Persona Prompt §7 (Chat sobre o Material).
const materialChatSystemPrompt = `Você é Arq, tutor de IA do ArqLearn (Arquitetura e Urbanismo). O usuário está fazendo uma
pergunta sobre um material específico que ele enviou. Responda SOMENTE com base no trecho do
material fornecido nesta mensagem — nunca use conhecimento geral não presente no texto, nunca
misture com outro material. Se a pergunta não tiver relação com o conteúdo fornecido, recuse com
clareza (não invente resposta pra parecer útil). Responda em português, em JSON válido com
exatamente estes campos: "in_scope" (boolean — false se a pergunta não pode ser respondida com o
material fornecido), "answer" (string — a resposta, ou uma recusa educada explicando que o
material não cobre isso, quando in_scope=false), "source_excerpt" (string — o trecho exato do
material que fundamenta a resposta, string vazia se in_scope=false), "source_page" (integer ou
null — a página de origem do trecho, se souber).`

// contentChunk espelha uma linha de "content_chunks" (Database Design §5) — só as colunas que
// summary/chat precisam, sem o vetor de embedding (não faz busca por similaridade ainda: o
// volume de um upload processado inteiro cabe em poucos chunks, mesma decisão já tomada em
// cmd/generate-questions -upload-id=, ver Docs/CLAUDE.md).
type contentChunk struct {
	ID          string
	TextContent string
	Page        *int
}

const fetchUploadOwnerQuery = `SELECT status FROM uploads WHERE id = $1 AND user_id = $2`

// fetchUploadStatus confere posse (upload_id + user_id autenticado, nunca aceitar user_id de
// outro lugar) e devolve o status de processamento — chamadores decidem 404 vs 409 a partir daqui.
func fetchUploadStatus(ctx context.Context, pool *pgxpool.Pool, uploadID, userID string) (string, error) {
	var status string
	err := pool.QueryRow(ctx, fetchUploadOwnerQuery, uploadID, userID).Scan(&status)
	return status, err
}

const fetchChunksQuery = `
	SELECT id, text_content, source_ref->>'page'
	FROM content_chunks
	WHERE upload_id = $1
	ORDER BY (source_ref->>'page')::int NULLS LAST, created_at
`

func fetchContentChunks(ctx context.Context, pool *pgxpool.Pool, uploadID string) ([]contentChunk, error) {
	rows, err := pool.Query(ctx, fetchChunksQuery, uploadID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var chunks []contentChunk
	for rows.Next() {
		var c contentChunk
		var page *string
		if err := rows.Scan(&c.ID, &c.TextContent, &page); err != nil {
			return nil, err
		}
		if page != nil {
			if parsed, err := strconv.Atoi(*page); err == nil {
				c.Page = &parsed
			}
		}
		chunks = append(chunks, c)
	}
	return chunks, rows.Err()
}

// chunksAsContext concatena os chunks num único bloco de texto anotado por página, formato que o
// prompt de summary/chat consegue citar de volta (source_page/source_ref).
func chunksAsContext(chunks []contentChunk) string {
	var b strings.Builder
	for _, c := range chunks {
		if c.Page != nil {
			fmt.Fprintf(&b, "[página %d]\n%s\n\n", *c.Page, c.TextContent)
		} else {
			fmt.Fprintf(&b, "%s\n\n", c.TextContent)
		}
	}
	return b.String()
}

func chunkIDs(chunks []contentChunk) []string {
	ids := make([]string, len(chunks))
	for i, c := range chunks {
		ids[i] = c.ID
	}
	return ids
}

// uploadReady confere o mesmo par de erros documentado em API Spec §6.2/§6.3 pros três handlers
// abaixo: 404 se o upload não existe (ou não é do usuário autenticado), 409 se existe mas ainda
// não terminou de processar (ou não tem chunk nenhum — inconsistência que também tratamos como
// "não pronto" em vez de 500, ver Persona Prompt §9 sobre conteúdo insuficiente).
func uploadReady(w http.ResponseWriter, ctx context.Context, pool *pgxpool.Pool, uploadID, userID string) ([]contentChunk, bool) {
	status, err := fetchUploadStatus(ctx, pool, uploadID, userID)
	if err == pgx.ErrNoRows {
		apierror.Write(w, http.StatusNotFound, "UPLOAD_NOT_FOUND", "Upload não encontrado.")
		return nil, false
	}
	if err != nil {
		apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar upload.")
		return nil, false
	}
	if status != "ready_for_review" && status != "published" {
		apierror.Write(w, http.StatusConflict, "UPLOAD_NOT_READY", "Upload ainda não terminou o processamento.")
		return nil, false
	}
	chunks, err := fetchContentChunks(ctx, pool, uploadID)
	if err != nil {
		apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar conteúdo do upload.")
		return nil, false
	}
	if len(chunks) == 0 {
		apierror.Write(w, http.StatusConflict, "UPLOAD_NOT_READY", "Upload ainda não terminou o processamento.")
		return nil, false
	}
	return chunks, true
}

// contentSummaryDoc espelha "content_summaries" (Database Design §4.7).
type contentSummaryDoc struct {
	ID             string     `bson:"_id" json:"-"`
	UploadID       string     `bson:"upload_id" json:"upload_id"`
	Title          string     `bson:"title" json:"title"`
	Synopsis       string     `bson:"synopsis" json:"synopsis"`
	KeyPoints      []keyPoint `bson:"key_points" json:"key_points"`
	ArchitectTip   *string    `bson:"architect_tip" json:"architect_tip"`
	SourceChunkIDs []string   `bson:"source_chunk_ids" json:"-"`
	GeneratedAt    time.Time  `bson:"generated_at" json:"generated_at"`
}

type keyPoint struct {
	Title       string `bson:"title" json:"title"`
	Explanation string `bson:"explanation" json:"explanation"`
}

type groqSummaryOutput struct {
	Title        string     `json:"title"`
	Synopsis     string     `json:"synopsis"`
	KeyPoints    []keyPoint `json:"key_points"`
	ArchitectTip *string    `json:"architect_tip"`
}

// handleUploadSummary implementa GET /v1/uploads/{upload_id}/summary (API Spec §6.2) — gera sob
// demanda na primeira chamada (processamento síncrono, upload já precisa estar pronto) e
// devolve o mesmo resumo cacheado nas chamadas seguintes (content_summaries, único por upload_id).
func handleUploadSummary(pool *pgxpool.Pool, mongoDB *mongo.Database, groq *groqclient.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}
		if pool == nil || mongoDB == nil {
			apierror.Write(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Serviço indisponível.")
			return
		}
		if !groq.Enabled() {
			apierror.Write(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Resumo indisponível no momento.")
			return
		}

		uploadID := r.PathValue("upload_id")

		var cached contentSummaryDoc
		err := mongoDB.Collection("content_summaries").FindOne(r.Context(), bson.M{"upload_id": uploadID}).Decode(&cached)
		if err == nil {
			writeJSON(w, http.StatusOK, cached)
			return
		}
		if err != mongo.ErrNoDocuments {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar resumo.")
			return
		}

		chunks, ok := uploadReady(w, r.Context(), pool, uploadID, userID)
		if !ok {
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
		defer cancel()
		raw, err := groq.CompleteJSON(ctx, summarySystemPrompt, chunksAsContext(chunks))
		if err != nil {
			apierror.Write(w, http.StatusBadGateway, "AI_PROVIDER_ERROR", "Falha ao gerar resumo.")
			return
		}

		var parsed groqSummaryOutput
		if err := json.Unmarshal([]byte(raw), &parsed); err != nil {
			apierror.Write(w, http.StatusBadGateway, "AI_PROVIDER_ERROR", "Resposta do provedor de IA em formato inesperado.")
			return
		}

		doc := contentSummaryDoc{
			ID:             uuid.New().String(),
			UploadID:       uploadID,
			Title:          parsed.Title,
			Synopsis:       parsed.Synopsis,
			KeyPoints:      parsed.KeyPoints,
			ArchitectTip:   parsed.ArchitectTip,
			SourceChunkIDs: chunkIDs(chunks),
			GeneratedAt:    time.Now().UTC(),
		}
		if _, err := mongoDB.Collection("content_summaries").InsertOne(r.Context(), doc); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao salvar resumo.")
			return
		}

		writeJSON(w, http.StatusOK, doc)
	}
}

// materialChatMessageDoc espelha "material_chat_messages" (Database Design §4.8).
type materialChatMessageDoc struct {
	ID             string    `bson:"_id" json:"message_id"`
	UploadID       string    `bson:"upload_id" json:"-"`
	UserID         string    `bson:"user_id" json:"-"`
	Role           string    `bson:"role" json:"role"`
	Message        string    `bson:"message" json:"message"`
	SourceChunkIDs []string  `bson:"source_chunk_ids" json:"-"`
	CreatedAt      time.Time `bson:"created_at" json:"created_at"`
}

type materialChatRequest struct {
	Message string `json:"message"`
}

type groqChatOutput struct {
	InScope       bool   `json:"in_scope"`
	Answer        string `json:"answer"`
	SourceExcerpt string `json:"source_excerpt"`
	SourcePage    *int   `json:"source_page"`
}

// handlePostMaterialChat implementa POST /v1/uploads/{upload_id}/chat (API Spec §6.3) — resposta
// ancorada por RAG ao próprio upload (Persona Prompt §7: nunca mistura contexto de outro material).
func handlePostMaterialChat(pool *pgxpool.Pool, mongoDB *mongo.Database, groq *groqclient.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}
		if pool == nil || mongoDB == nil {
			apierror.Write(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Serviço indisponível.")
			return
		}
		if !groq.Enabled() {
			apierror.Write(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Chat indisponível no momento.")
			return
		}

		uploadID := r.PathValue("upload_id")

		var req materialChatRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Message) == "" {
			apierror.Write(w, http.StatusBadRequest, "INVALID_BODY", "Corpo da requisição inválido.")
			return
		}

		chunks, ok := uploadReady(w, r.Context(), pool, uploadID, userID)
		if !ok {
			return
		}

		userPrompt := fmt.Sprintf("Material:\n%s\n\nPergunta do usuário: %s", chunksAsContext(chunks), req.Message)

		ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
		defer cancel()
		raw, err := groq.CompleteJSON(ctx, materialChatSystemPrompt, userPrompt)
		if err != nil {
			apierror.Write(w, http.StatusBadGateway, "AI_PROVIDER_ERROR", "Falha ao gerar resposta.")
			return
		}

		var parsed groqChatOutput
		if err := json.Unmarshal([]byte(raw), &parsed); err != nil {
			apierror.Write(w, http.StatusBadGateway, "AI_PROVIDER_ERROR", "Resposta do provedor de IA em formato inesperado.")
			return
		}

		now := time.Now().UTC()
		userMsg := materialChatMessageDoc{
			ID: uuid.New().String(), UploadID: uploadID, UserID: userID,
			Role: "user", Message: req.Message, SourceChunkIDs: nil, CreatedAt: now,
		}
		if _, err := mongoDB.Collection("material_chat_messages").InsertOne(r.Context(), userMsg); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao salvar mensagem.")
			return
		}

		if !parsed.InScope {
			assistantMsg := materialChatMessageDoc{
				ID: uuid.New().String(), UploadID: uploadID, UserID: userID,
				Role: "assistant", Message: parsed.Answer, SourceChunkIDs: nil, CreatedAt: time.Now().UTC(),
			}
			_, _ = mongoDB.Collection("material_chat_messages").InsertOne(r.Context(), assistantMsg)
			apierror.Write(w, http.StatusUnprocessableEntity, "QUESTION_OUT_OF_SCOPE", parsed.Answer)
			return
		}

		assistantMsg := materialChatMessageDoc{
			ID: uuid.New().String(), UploadID: uploadID, UserID: userID,
			Role: "assistant", Message: parsed.Answer, SourceChunkIDs: chunkIDs(chunks), CreatedAt: time.Now().UTC(),
		}
		if _, err := mongoDB.Collection("material_chat_messages").InsertOne(r.Context(), assistantMsg); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao salvar resposta.")
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"message_id":     assistantMsg.ID,
			"answer":         parsed.Answer,
			"source_excerpt": parsed.SourceExcerpt,
			"source_ref":     map[string]any{"page": parsed.SourcePage},
			"created_at":     assistantMsg.CreatedAt,
		})
	}
}

// handleGetMaterialChatHistory implementa GET /v1/uploads/{upload_id}/chat — histórico da thread
// do usuário autenticado (Persona Prompt §7.5: isolado por (upload_id, user_id), nunca
// compartilhado). Mesma paginação por cursor (offset em base64) dos outros endpoints de listagem.
func handleGetMaterialChatHistory(mongoDB *mongo.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}
		if mongoDB == nil {
			apierror.Write(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Serviço indisponível.")
			return
		}

		uploadID := r.PathValue("upload_id")

		limit := 20
		if raw := r.URL.Query().Get("limit"); raw != "" {
			if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 && parsed <= 100 {
				limit = parsed
			}
		}
		offset := 0
		if raw := r.URL.Query().Get("cursor"); raw != "" {
			if decoded, err := base64.StdEncoding.DecodeString(raw); err == nil {
				if parsed, err := strconv.Atoi(string(decoded)); err == nil {
					offset = parsed
				}
			}
		}

		findOpts := options.Find().SetLimit(int64(limit) + 1).SetSkip(int64(offset)).SetSort(bson.D{{Key: "created_at", Value: 1}})
		cur, err := mongoDB.Collection("material_chat_messages").Find(r.Context(), bson.M{"upload_id": uploadID, "user_id": userID}, findOpts)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar histórico.")
			return
		}
		defer cur.Close(r.Context())

		var items []materialChatMessageDoc
		if err := cur.All(r.Context(), &items); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler histórico.")
			return
		}
		if items == nil {
			items = []materialChatMessageDoc{}
		}

		var nextCursor *string
		if len(items) > limit {
			items = items[:limit]
			nc := base64.StdEncoding.EncodeToString([]byte(strconv.Itoa(offset + limit)))
			nextCursor = &nc
		}

		writeJSON(w, http.StatusOK, map[string]any{"data": items, "next_cursor": nextCursor})
	}
}
