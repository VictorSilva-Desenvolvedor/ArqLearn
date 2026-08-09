// Command generate-questions chama internal/geminiclient com texto-fonte real, fora do fluxo de
// evento content.uploaded (que depende dos estágios 1-3, ainda sem consumidor de fila real — ver
// internal/pipeline/pipeline.go e cmd/worker). Dois modos de texto-fonte:
//
//   - -upload-id: busca os chunks reais já extraídos/embeddados em content_chunks (Postgres,
//     ver cmd/ingest-file) pro upload indicado — uma pergunta por chunk/página, source_upload_id
//     preenchido de verdade (fecha Docs/PENDENCIAS_IA.md #3).
//   - -text: modo antigo, cola um texto já extraído manualmente (trilha curada sem upload, como
//     Maquetes hoje) — source_upload_id continua null.
//
// Grava as perguntas válidas direto no MongoDB. confidence "high" vai direto pra "approved" (já
// jogável, sem revisão humana — decisão do usuário, ver Docs/PENDENCIAS_IA.md #5); "medium"/"low"
// ficam "pending" até cmd/review-questions aprovar. Garante que a lição/unidade de destino
// existem, criando-as se necessário. A trilha (track) precisa já existir — ver
// services/monolith/seeds/ para exemplos.
//
// Uso:
//
//	GEMINI_API_KEY=... MONGODB_URI=... go run ./cmd/generate-questions \
//	  -text=pagina.txt -page=7 -count=5 \
//	  -track-id=track_s02_maquetes -lesson-id=lesson_maquetes_u1 -lesson-title="Unidade 1"
//
//	GEMINI_API_KEY=... MONGODB_URI=... DATABASE_URL=... go run ./cmd/generate-questions \
//	  -upload-id=<uuid de uploads.id> -count=5 \
//	  -track-id=track_s02_maquetes -lesson-id=lesson_maquetes_u5 -lesson-title="Unidade 5"
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"arqlearn/ai-content-pipeline/internal/geminiclient"
	"arqlearn/ai-content-pipeline/internal/pgstore"
	"arqlearn/ai-content-pipeline/internal/store"
)

func main() {
	textPath := flag.String("text", "", "caminho do arquivo de texto-fonte (modo manual — mutuamente exclusivo com -upload-id)")
	uploadID := flag.String("upload-id", "", "uploads.id (uuid) — busca chunks reais em content_chunks (modo RAG — mutuamente exclusivo com -text)")
	page := flag.Int("page", 1, "número da página de origem no modo -text, ecoado em source_page (ignorado no modo -upload-id, que usa a página real de cada chunk)")
	count := flag.Int("count", 5, "quantidade de perguntas a gerar por chunk/página")
	trackID := flag.String("track-id", "", "_id da trilha (tracks) — precisa já existir (obrigatório)")
	lessonID := flag.String("lesson-id", "", "_id da lição (lessons) — cria se não existir (obrigatório)")
	lessonTitle := flag.String("lesson-title", "", "título da lição/unidade, usado só ao criar")
	flag.Parse()

	if (*textPath == "") == (*uploadID == "") {
		log.Fatal("informe exatamente um de -text ou -upload-id")
	}
	if *trackID == "" || *lessonID == "" {
		log.Fatal("uso: generate-questions (-text=arquivo.txt -page=N | -upload-id=uuid) -count=N -track-id=... -lesson-id=... [-lesson-title=\"...\"]")
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("GEMINI_API_KEY não configurada no ambiente")
	}
	client := geminiclient.New(apiKey)

	sourceChunks, err := loadSourceChunks(*textPath, *uploadID, *page)
	if err != nil {
		log.Fatal(err)
	}

	var valid []geminiclient.GeneratedQuestion
	var total int
	for _, chunk := range sourceChunks {
		questions, err := client.GenerateQuestions(context.Background(), chunk.Text, chunk.Page, *count)
		if err != nil {
			log.Fatal(quotaHint(err))
		}
		total += len(questions)
		for i, q := range questions {
			if err := geminiclient.Validate(q); err != nil {
				log.Printf("AVISO: pergunta %d/%d (página %d) reprovada na validação, descartada — %v", i+1, len(questions), chunk.Page, err)
				continue
			}
			valid = append(valid, q)
		}
	}
	log.Printf("%d/%d perguntas passaram na validação estrutural (ver SAD §9.5)", len(valid), total)
	if len(valid) == 0 {
		log.Fatal("nenhuma pergunta válida gerada — nada foi gravado no banco")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	mongoClient, db, err := store.Connect(ctx, os.Getenv("MONGODB_URI"), os.Getenv("MONGODB_DATABASE"))
	if err != nil {
		log.Fatalf("falha ao conectar no MongoDB: %v", err)
	}
	defer func() { _ = mongoClient.Disconnect(ctx) }()

	if err := ensureTrackExists(ctx, db, *trackID); err != nil {
		log.Fatal(err)
	}

	var sourceUploadID any
	if *uploadID != "" {
		sourceUploadID = *uploadID
	}

	now := time.Now().UTC()
	newQuestionIDs := make([]string, 0, len(valid))
	autoApproved := 0
	for i, q := range valid {
		id := fmt.Sprintf("%s_q_%d_%d", *lessonID, now.Unix(), i)
		// confidence "high" pula revisão humana e vai direto pra "approved" — decisão explícita
		// do usuário (Docs/PENDENCIAS_IA.md, pendência #5). "medium"/"low" continuam "pending"
		// até cmd/review-questions aprovar manualmente.
		reviewStatus := "pending"
		if q.Confidence == "high" {
			reviewStatus = "approved"
			autoApproved++
		}
		_, err := db.Collection("questions").InsertOne(ctx, bson.M{
			"_id":                id,
			"lesson_id":          *lessonID,
			"type":               q.Type,
			"prompt":             q.Prompt,
			"options":            q.Options,
			"correct_answer":     q.CorrectAnswer,
			"explanation":        q.Explanation,
			"difficulty":         q.Difficulty,
			"confidence":         q.Confidence,
			"source_upload_id":   sourceUploadID,
			"source_excerpt_ref": bson.M{"page": q.SourcePage},
			"review_status":      reviewStatus,
			"created_at":         now,
			"updated_at":         now,
		})
		if err != nil {
			log.Fatalf("falha ao gravar pergunta %d: %v", i+1, err)
		}
		newQuestionIDs = append(newQuestionIDs, id)
	}

	if err := upsertLesson(ctx, db, *lessonID, *trackID, *lessonTitle, newQuestionIDs, now); err != nil {
		log.Fatalf("falha ao atualizar lição: %v", err)
	}
	if err := ensureLessonInTrackUnits(ctx, db, *trackID, *lessonID, *lessonTitle, now); err != nil {
		log.Fatalf("falha ao atualizar unidades da trilha: %v", err)
	}

	log.Printf("%d perguntas gravadas em lesson_id=%s, track_id=%s (%d auto-aprovadas por confidence=high, %d aguardando cmd/review-questions)",
		len(newQuestionIDs), *lessonID, *trackID, autoApproved, len(newQuestionIDs)-autoApproved)
}

type sourceChunk struct {
	Page int
	Text string
}

// loadSourceChunks resolve o texto-fonte pro modo escolhido — -text vira um único chunk manual;
// -upload-id busca todos os chunks reais já extraídos/embeddados (cmd/ingest-file) daquele
// upload, em ordem de página.
func loadSourceChunks(textPath, uploadID string, page int) ([]sourceChunk, error) {
	if textPath != "" {
		textBytes, err := os.ReadFile(textPath)
		if err != nil {
			return nil, fmt.Errorf("falha ao ler %s: %w", textPath, err)
		}
		return []sourceChunk{{Page: page, Text: string(textBytes)}}, nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := pgstore.Connect(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, fmt.Errorf("falha ao conectar no Postgres: %w", err)
	}
	defer pool.Close()

	chunks, err := pgstore.ChunksForUpload(ctx, pool, uploadID)
	if err != nil {
		return nil, err
	}
	if len(chunks) == 0 {
		return nil, fmt.Errorf("nenhum chunk encontrado em content_chunks pro upload_id=%s — rode cmd/ingest-file primeiro", uploadID)
	}

	result := make([]sourceChunk, len(chunks))
	for i, c := range chunks {
		result[i] = sourceChunk{Page: c.Page, Text: c.Text}
	}
	return result, nil
}

func ensureTrackExists(ctx context.Context, db *mongo.Database, trackID string) error {
	count, err := db.Collection("tracks").CountDocuments(ctx, bson.M{"_id": trackID})
	if err != nil {
		return fmt.Errorf("consultando trilha: %w", err)
	}
	if count == 0 {
		return fmt.Errorf("trilha %q não existe — crie-a antes (ver services/monolith/seeds/001_tracks_curriculo_unopar.js como exemplo)", trackID)
	}
	return nil
}

func upsertLesson(ctx context.Context, db *mongo.Database, lessonID, trackID, lessonTitle string, newQuestionIDs []string, now time.Time) error {
	_, err := db.Collection("lessons").UpdateOne(ctx,
		bson.M{"_id": lessonID},
		bson.M{
			"$setOnInsert": bson.M{
				"_id":               lessonID,
				"track_id":          trackID,
				"title":             titleOrDefault(lessonTitle, lessonID),
				"difficulty":        "medium",
				"estimated_minutes": 8,
				"created_at":        now,
			},
			"$addToSet": bson.M{"question_ids": bson.M{"$each": newQuestionIDs}},
			"$set":      bson.M{"updated_at": now},
		},
		options.UpdateOne().SetUpsert(true),
	)
	return err
}

// ensureLessonInTrackUnits garante que lessonID está referenciada em alguma unit da trilha —
// não mexe se já estiver (independente de qual unit), só cria uma unit nova no final se a lição
// ainda não aparecer em nenhuma.
func ensureLessonInTrackUnits(ctx context.Context, db *mongo.Database, trackID, lessonID, lessonTitle string, now time.Time) error {
	var track struct {
		Units []struct {
			LessonIDs []string `bson:"lesson_ids"`
		} `bson:"units"`
	}
	if err := db.Collection("tracks").FindOne(ctx, bson.M{"_id": trackID}).Decode(&track); err != nil {
		return err
	}

	for _, u := range track.Units {
		for _, id := range u.LessonIDs {
			if id == lessonID {
				return nil // já referenciada em alguma unidade — nada a fazer
			}
		}
	}

	newUnit := bson.M{
		"id":         "unit_" + lessonID,
		"title":      titleOrDefault(lessonTitle, lessonID),
		"order":      len(track.Units) + 1,
		"lesson_ids": []string{lessonID},
	}
	_, err := db.Collection("tracks").UpdateOne(ctx,
		bson.M{"_id": trackID},
		bson.M{"$push": bson.M{"units": newUnit}, "$set": bson.M{"updated_at": now}},
	)
	return err
}

func titleOrDefault(title, fallback string) string {
	if title != "" {
		return title
	}
	return fallback
}

// quotaHint acrescenta uma dica legível quando o erro do provedor parece ser de quota/limite —
// sem isso, "geminiclient: <mensagem bruta da API>" é fácil de confundir com um bug de verdade.
// Não há alerta automático de quota (Docs/PENDENCIAS_IA.md #8) — isso é a mitigação mínima: só
// deixa o erro óbvio quando ele já aconteceu, não avisa antes.
func quotaHint(err error) string {
	msg := err.Error()
	lower := strings.ToLower(msg)
	for _, marker := range []string{"quota", "rate limit", "429", "resource_exhausted"} {
		if strings.Contains(lower, marker) {
			return fmt.Sprintf("falha ao gerar perguntas (parece ser limite de quota do tier grátis do Gemini — aguarde e tente de novo, ou confira https://aistudio.google.com/apikey): %s", msg)
		}
	}
	return fmt.Sprintf("falha ao gerar perguntas: %s", msg)
}
