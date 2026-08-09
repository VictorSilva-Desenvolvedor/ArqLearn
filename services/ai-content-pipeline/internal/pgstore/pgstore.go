// Package pgstore grava chunks de texto + embedding em content_chunks (Postgres/pgvector,
// Database Design §5) — o lado ai-content-pipeline da mesma tabela que
// services/monolith/internal/db escreve/lê pro resto do domínio (uploads, etc).
package pgstore

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Connect abre o pool de conexões a partir de DATABASE_URL — mesmo padrão de
// services/monolith/internal/db.Connect, incluindo o simple protocol mode: o pooler Supavisor
// (transaction mode, porta 6543) compartilha conexões físicas entre sessões lógicas diferentes,
// e o cache de prepared statements nomeados do pgx colide entre clientes distintos nesse cenário
// ("prepared statement already exists") — descoberto na prática ao integrar o monolith com o
// mesmo banco, não é uma precaução teórica repetida à toa aqui.
func Connect(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	if databaseURL == "" {
		return nil, fmt.Errorf("pgstore: DATABASE_URL não configurada")
	}

	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("pgstore: parseando DATABASE_URL: %w", err)
	}
	cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("pgstore: criando pool de conexões: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("pgstore: ping no Postgres: %w", err)
	}
	return pool, nil
}

const insertChunkQuery = `
	INSERT INTO content_chunks (upload_id, source_type, text_content, source_ref, embedding)
	VALUES ($1, $2, $3, $4, $5::vector)
`

// InsertChunk grava um chunk (1 página, ver internal/pdfextract) com seu embedding. embedding
// precisa ter exatamente a dimensão de content_chunks.embedding (VECTOR(1536)) — geminiclient.Embed
// já garante isso, não revalidado aqui de novo.
func InsertChunk(ctx context.Context, pool *pgxpool.Pool, uploadID, sourceType, text string, page int, embedding []float32) error {
	sourceRef := fmt.Sprintf(`{"page": %d}`, page)
	_, err := pool.Exec(ctx, insertChunkQuery, uploadID, sourceType, text, sourceRef, formatVector(embedding))
	if err != nil {
		return fmt.Errorf("pgstore: falha ao gravar chunk (upload_id=%s, page=%d): %w", uploadID, page, err)
	}
	return nil
}

// Chunk é um trecho de content_chunks já extraído/embeddado, pronto pra virar texto-fonte de
// geração de pergunta (ver cmd/generate-questions -upload-id).
type Chunk struct {
	Page int
	Text string
}

const chunksForUploadQuery = `
	SELECT text_content, (source_ref->>'page')::int
	FROM content_chunks
	WHERE upload_id = $1
	ORDER BY (source_ref->>'page')::int
`

// ChunksForUpload lista todos os chunks de um upload, em ordem de página. Sem busca por
// similaridade (embedding <=>) — um upload processado inteiro cabe em poucos chunks/páginas
// nesta fase, buscar todos já basta (ver plano de ingestão real, Fase 7).
func ChunksForUpload(ctx context.Context, pool *pgxpool.Pool, uploadID string) ([]Chunk, error) {
	rows, err := pool.Query(ctx, chunksForUploadQuery, uploadID)
	if err != nil {
		return nil, fmt.Errorf("pgstore: falha ao consultar chunks do upload %s: %w", uploadID, err)
	}
	defer rows.Close()

	var chunks []Chunk
	for rows.Next() {
		var c Chunk
		if err := rows.Scan(&c.Text, &c.Page); err != nil {
			return nil, fmt.Errorf("pgstore: falha ao ler chunk: %w", err)
		}
		chunks = append(chunks, c)
	}
	return chunks, rows.Err()
}

// formatVector serializa pro formato textual que o pgvector aceita em input/cast ("[0.1,0.2,...]")
// — evita puxar uma dependência extra (github.com/pgvector/pgvector-go) só pra isso.
func formatVector(v []float32) string {
	parts := make([]string, len(v))
	for i, f := range v {
		parts[i] = strconv.FormatFloat(float64(f), 'f', -1, 32)
	}
	return "[" + strings.Join(parts, ",") + "]"
}
