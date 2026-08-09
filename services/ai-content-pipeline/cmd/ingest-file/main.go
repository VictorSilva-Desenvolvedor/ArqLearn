// Command ingest-file roda o fluxo real de ingestão de ponta a ponta, fora do fluxo de evento
// content.uploaded (que continua sem consumidor real de fila — ver Docs/CLAUDE.md, cmd/worker):
// sobe um PDF local pro R2, cria/atualiza o registro em uploads (Postgres), extrai texto por
// página (internal/pdfextract), gera embedding de cada página (geminiclient.Embed) e grava em
// content_chunks (internal/pgstore) — mesmo espírito operacional de cmd/generate-questions
// (ferramenta real, não só de teste).
//
// Só PDF é suportado por enquanto (mesma limitação de internal/pdfextract — sem OCR/vídeo).
//
// Uso:
//
//	GEMINI_API_KEY=... DATABASE_URL=... R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... \
//	R2_SECRET_ACCESS_KEY=... R2_S3_ENDPOINT=... R2_BUCKET_NAME=... \
//	go run ./cmd/ingest-file -file=material.pdf -user-id=<uuid real de users.id>
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"arqlearn/ai-content-pipeline/internal/geminiclient"
	"arqlearn/ai-content-pipeline/internal/objectstorage"
	"arqlearn/ai-content-pipeline/internal/pdfextract"
	"arqlearn/ai-content-pipeline/internal/pgstore"
)

func main() {
	filePath := flag.String("file", "", "caminho do PDF local (obrigatório)")
	userID := flag.String("user-id", "", "users.id (uuid) dono do upload — precisa já existir (obrigatório)")
	filename := flag.String("filename", "", "nome do arquivo salvo em uploads.filename (default: nome do -file)")
	flag.Parse()

	if *filePath == "" || *userID == "" {
		log.Fatal("uso: ingest-file -file=material.pdf -user-id=<uuid>")
	}
	if filepath.Ext(*filePath) != ".pdf" {
		log.Fatal("apenas PDF é suportado nesta fase — ver internal/pdfextract")
	}

	data, err := os.ReadFile(*filePath)
	if err != nil {
		log.Fatalf("falha ao ler %s: %v", *filePath, err)
	}

	name := *filename
	if name == "" {
		name = filepath.Base(*filePath)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
	defer cancel()

	pool, err := pgstore.Connect(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("falha ao conectar no Postgres: %v", err)
	}
	defer pool.Close()

	r2 := objectstorage.New(
		os.Getenv("R2_ACCOUNT_ID"), os.Getenv("R2_ACCESS_KEY_ID"), os.Getenv("R2_SECRET_ACCESS_KEY"),
		os.Getenv("R2_S3_ENDPOINT"), os.Getenv("R2_BUCKET_NAME"),
	)
	if !r2.Enabled() {
		log.Fatal("credenciais R2 ausentes no ambiente")
	}

	gemini := geminiclient.New(os.Getenv("GEMINI_API_KEY"))
	if !gemini.Enabled() {
		log.Fatal("GEMINI_API_KEY ausente no ambiente")
	}

	uploadID := uuid.New()
	storageKey := fmt.Sprintf("uploads/%s/%s/%s", *userID, uploadID, name)

	if _, err := pool.Exec(ctx, `
		INSERT INTO uploads (id, user_id, filename, file_type, storage_key, size_bytes, status)
		VALUES ($1, $2, $3, 'pdf', $4, $5, 'received')
	`, uploadID, *userID, name, storageKey, len(data)); err != nil {
		log.Fatalf("falha ao criar registro de upload: %v", err)
	}

	log.Printf("[1/4] subindo %s pro R2 (key=%s)...", name, storageKey)
	if err := r2.Upload(ctx, storageKey, "application/pdf", data); err != nil {
		markFailed(ctx, pool, uploadID, err)
		log.Fatalf("falha ao subir pro R2: %v", err)
	}
	setStatus(ctx, pool, uploadID, "processing", nil)

	log.Printf("[2/4] extraindo texto...")
	pages, err := pdfextract.ExtractPages(data)
	if err != nil {
		markFailed(ctx, pool, uploadID, err)
		log.Fatalf("falha ao extrair texto: %v", err)
	}
	log.Printf("%d página(s) com texto extraídas", len(pages))

	log.Printf("[3/4] gerando embeddings e gravando chunks...")
	for i, p := range pages {
		embedding, err := gemini.Embed(ctx, p.Text)
		if err != nil {
			markFailed(ctx, pool, uploadID, err)
			log.Fatalf("falha ao gerar embedding da página %d: %v", p.Number, err)
		}
		if err := pgstore.InsertChunk(ctx, pool, uploadID.String(), "pdf", p.Text, p.Number, embedding); err != nil {
			markFailed(ctx, pool, uploadID, err)
			log.Fatalf("falha ao gravar chunk da página %d: %v", p.Number, err)
		}
		progress := int(float64(i+1) / float64(len(pages)) * 100)
		setStatus(ctx, pool, uploadID, "processing", &progress)
		log.Printf("  página %d/%d ok (%d%%)", i+1, len(pages), progress)
	}

	log.Printf("[4/4] concluído.")
	setStatus(ctx, pool, uploadID, "ready_for_review", nil)
	log.Printf("upload_id=%s pronto — %d chunks em content_chunks, aguardando geração de pergunta (cmd/generate-questions -upload-id=%s)", uploadID, len(pages), uploadID)
}

func setStatus(ctx context.Context, pool *pgxpool.Pool, uploadID uuid.UUID, status string, progressPercent *int) {
	_, err := pool.Exec(ctx,
		`UPDATE uploads SET status = $1, progress_percent = $2, updated_at = now() WHERE id = $3`,
		status, progressPercent, uploadID,
	)
	if err != nil {
		log.Printf("aviso: falha ao atualizar status do upload %s: %v", uploadID, err)
	}
}

func markFailed(ctx context.Context, pool *pgxpool.Pool, uploadID uuid.UUID, cause error) {
	msg := cause.Error()
	_, err := pool.Exec(ctx,
		`UPDATE uploads SET status = 'failed', error_message = $1, updated_at = now() WHERE id = $2`,
		msg, uploadID,
	)
	if err != nil {
		log.Printf("aviso: falha ao marcar upload %s como failed: %v", uploadID, err)
	}
}
