// Package ingestion cobre o Ingestion Service (SAD §8.4 / API Spec §7). Uploads usam
// URL pré-assinada direto ao object storage — nunca fazer proxy de binário pela API
// (ver Docs/CLAUDE.md, "O que NÃO fazer").
//
// POST /v1/uploads, .../complete e GET /v1/uploads/{upload_id} são reais a partir daqui —
// gravam/leem a tabela uploads (Postgres, migrations/0002_uploads) e geram a URL pré-assinada via
// internal/objectstorage (R2). O disparo do processamento (extração/chunking/embeddings) depois
// de .../complete continua manual nesta fase (cmd/ingest-file, ai-content-pipeline) — não há fila
// real ainda (ver Docs/CLAUDE.md, cmd/worker). GET/PATCH .../questions continuam stub — dependem
// da revisão de perguntas geradas por upload, fora do escopo desta demanda.
package ingestion

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
	"arqlearn/monolith/internal/objectstorage"
)

// maxUploadSizeBytes segue o limite documentado em API Spec §3.4/§7 (UPLOAD_TOO_LARGE, 2 GB).
const maxUploadSizeBytes = 2 * 1024 * 1024 * 1024

// contentTypeToFileType mapeia o content_type enviado pelo cliente pro enum file_type de
// uploads (migrations/0002_uploads) — a API recebe MIME type, o schema guarda a categoria.
func contentTypeToFileType(contentType string) (string, bool) {
	switch {
	case contentType == "application/pdf":
		return "pdf", true
	case contentType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		return "docx", true
	case contentType == "application/vnd.openxmlformats-officedocument.presentationml.presentation":
		return "pptx", true
	case strings.HasPrefix(contentType, "image/"):
		return "image", true
	case strings.HasPrefix(contentType, "video/"):
		return "video", true
	default:
		return "", false
	}
}

func RegisterRoutes(mux *http.ServeMux, pool *pgxpool.Pool, verifier *authmiddleware.Verifier, r2 *objectstorage.Client) {
	mux.Handle("POST /v1/uploads", verifier.Middleware(http.HandlerFunc(handleCreateUpload(pool, r2))))
	mux.Handle("POST /v1/uploads/{upload_id}/complete", verifier.Middleware(http.HandlerFunc(handleCompleteUpload(pool))))
	mux.Handle("GET /v1/uploads/{upload_id}", verifier.Middleware(http.HandlerFunc(handleGetUpload(pool))))
	mux.HandleFunc("GET /v1/uploads/{upload_id}/questions", apierror.NotImplemented)
	mux.HandleFunc("PATCH /v1/uploads/{upload_id}/questions/{question_id}", apierror.NotImplemented)
}

type createUploadRequest struct {
	Filename    string `json:"filename"`
	ContentType string `json:"content_type"`
	SizeBytes   int64  `json:"size_bytes"`
}

type createUploadResponse struct {
	UploadID   string `json:"upload_id"`
	UploadURL  string `json:"upload_url"`
	StorageKey string `json:"storage_key"`
}

const insertUploadQuery = `
	INSERT INTO uploads (id, user_id, filename, file_type, storage_key, size_bytes, status)
	VALUES ($1, $2, $3, $4, $5, $6, 'received')
`

func handleCreateUpload(pool *pgxpool.Pool, r2 *objectstorage.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}
		if pool == nil {
			apierror.Write(w, http.StatusServiceUnavailable, "DATABASE_UNAVAILABLE", "Sem conexão com o banco.")
			return
		}
		if !r2.Enabled() {
			apierror.Write(w, http.StatusServiceUnavailable, "UPLOAD_STORAGE_UNAVAILABLE", "Object storage não configurado.")
			return
		}

		var req createUploadRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Filename == "" {
			apierror.Write(w, http.StatusBadRequest, "INVALID_BODY", "Corpo da requisição inválido.")
			return
		}

		if req.SizeBytes <= 0 || req.SizeBytes > maxUploadSizeBytes {
			apierror.Write(w, http.StatusRequestEntityTooLarge, "UPLOAD_TOO_LARGE", "Arquivo excede 2 GB.")
			return
		}

		fileType, ok := contentTypeToFileType(req.ContentType)
		if !ok {
			apierror.Write(w, http.StatusUnsupportedMediaType, "UPLOAD_UNSUPPORTED_FORMAT", "Tipo de arquivo não suportado.")
			return
		}

		uploadID := uuid.New()
		storageKey := fmt.Sprintf("uploads/%s/%s/%s", userID, uploadID, req.Filename)

		if _, err := pool.Exec(r.Context(), insertUploadQuery,
			uploadID, userID, req.Filename, fileType, storageKey, req.SizeBytes,
		); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao registrar upload.")
			return
		}

		uploadURL, err := r2.PresignUpload(r.Context(), storageKey, req.ContentType)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao gerar URL de upload.")
			return
		}

		writeJSON(w, http.StatusCreated, createUploadResponse{
			UploadID:   uploadID.String(),
			UploadURL:  uploadURL,
			StorageKey: storageKey,
		})
	}
}

const completeUploadQuery = `
	UPDATE uploads SET status = 'processing', updated_at = now()
	WHERE id = $1 AND user_id = $2
	RETURNING id
`

func handleCompleteUpload(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}
		if pool == nil {
			apierror.Write(w, http.StatusServiceUnavailable, "DATABASE_UNAVAILABLE", "Sem conexão com o banco.")
			return
		}

		uploadID := r.PathValue("upload_id")
		var id string
		err := pool.QueryRow(r.Context(), completeUploadQuery, uploadID, userID).Scan(&id)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusNotFound, "UPLOAD_NOT_FOUND", "Upload não encontrado.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar upload.")
			return
		}

		// Processamento (extração/chunking/embeddings) não dispara automaticamente aqui —
		// sem fila real nesta fase (ver Docs/CLAUDE.md, cmd/worker). Roda via
		// cmd/ingest-file apontando pro mesmo upload_id, manualmente, por enquanto.
		writeJSON(w, http.StatusAccepted, map[string]string{"status": "processing"})
	}
}

type uploadedContentResponse struct {
	ID              string    `json:"id"`
	FileType        string    `json:"file_type"`
	Status          string    `json:"status"`
	SizeBytes       int64     `json:"size_bytes"`
	ProgressPercent *int      `json:"progress_percent"`
	ErrorMessage    *string   `json:"error_message,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

const getUploadQuery = `
	SELECT id, file_type, status, size_bytes, progress_percent, error_message, created_at, updated_at
	FROM uploads
	WHERE id = $1 AND user_id = $2
`

func handleGetUpload(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}
		if pool == nil {
			apierror.Write(w, http.StatusServiceUnavailable, "DATABASE_UNAVAILABLE", "Sem conexão com o banco.")
			return
		}

		uploadID := r.PathValue("upload_id")
		var resp uploadedContentResponse
		err := pool.QueryRow(r.Context(), getUploadQuery, uploadID, userID).Scan(
			&resp.ID, &resp.FileType, &resp.Status, &resp.SizeBytes,
			&resp.ProgressPercent, &resp.ErrorMessage, &resp.CreatedAt, &resp.UpdatedAt,
		)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusNotFound, "UPLOAD_NOT_FOUND", "Upload não encontrado.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar upload.")
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
