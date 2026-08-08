// Package pipeline implementa os 6 estágios do AI Content Pipeline descritos no
// SAD §9 e no fluxo de sequência do TDD §8.1 (upload → IA → publicação).
package pipeline

import "log"

// ContentUploaded é o payload do evento content.uploaded (TDD §7.1), publicado pelo
// Ingestion Service quando um upload termina de ser enviado ao object storage.
type ContentUploaded struct {
	EventID    string `json:"event_id"`
	UploadID   string `json:"upload_id"`
	UserID     string `json:"user_id"`
	TenantID   string `json:"tenant_id,omitempty"`
	FileType   string `json:"file_type"` // pdf | docx | pptx | image | video
	StorageKey string `json:"storage_key"`
	SizeBytes  int64  `json:"size_bytes"`
	Timestamp  string `json:"timestamp"`
}

// Run executa os 6 estágios em sequência para um evento content.uploaded (SAD §9.1–9.6).
func Run(event ContentUploaded) error {
	log.Printf("pipeline: iniciando upload_id=%s file_type=%s", event.UploadID, event.FileType)

	if err := normalize(event); err != nil {
		return err
	}
	if err := extract(event); err != nil {
		return err
	}
	if err := structureRAG(event); err != nil {
		return err
	}
	if err := generateQuestions(event); err != nil {
		return err
	}
	if err := validateAndModerate(event); err != nil {
		return err
	}
	return publish(event)
}

// Estágio 1 — Ingestão e Normalização (SAD §9.1): detecção de tipo de arquivo e
// roteamento para o extrator apropriado (PDF/DOCX/PPTX, imagem ou vídeo).
func normalize(event ContentUploaded) error {
	log.Printf("pipeline: [1/6] normalize upload_id=%s", event.UploadID)
	// TODO: rotear por event.FileType para o extrator apropriado.
	return nil
}

// Estágio 2 — Extração de Conteúdo (SAD §9.2): OCR, Speech-to-Text ou visão
// computacional conforme o tipo de arquivo. Fase bootstrap: Tesseract/Whisper
// self-hosted (ver Docs/ArqLearn_Estrategia_Bootstrap.md §4).
func extract(event ContentUploaded) error {
	log.Printf("pipeline: [2/6] extract upload_id=%s", event.UploadID)
	return nil
}

// Estágio 3 — Estruturação Semântica / RAG (SAD §9.3): chunking + embeddings,
// gravados em content_chunks (Database Design §5, pgvector).
func structureRAG(event ContentUploaded) error {
	log.Printf("pipeline: [3/6] structureRAG upload_id=%s", event.UploadID)
	return nil
}

// Estágio 4 — Geração de Perguntas via LLM (SAD §9.4), seguindo estritamente
// Docs/ArqLearn_IA_Persona_System_Prompt.md (fidelidade ao trecho-fonte, sem alucinar).
func generateQuestions(event ContentUploaded) error {
	log.Printf("pipeline: [4/6] generateQuestions upload_id=%s", event.UploadID)
	return nil
}

// Estágio 5 — Validação e Moderação (SAD §9.5): perguntas com confidence "low"
// vão obrigatoriamente para revisão humana (Persona Prompt §4.7) — nunca publicar
// automaticamente nesse caso.
func validateAndModerate(event ContentUploaded) error {
	log.Printf("pipeline: [5/6] validateAndModerate upload_id=%s", event.UploadID)
	return nil
}

// Estágio 6 — Publicação (SAD §9.6): grava no banco de questões e emite
// questions.generated (TDD §7.2) para o Learning Service.
func publish(event ContentUploaded) error {
	log.Printf("pipeline: [6/6] publish upload_id=%s", event.UploadID)
	return nil
}
