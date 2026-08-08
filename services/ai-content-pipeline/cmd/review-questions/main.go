// Command review-questions lista perguntas com review_status "pending" (geradas por
// cmd/generate-questions) e permite aprovar ou rejeitar uma a uma pelo terminal — o portão de
// segurança antes de uma pergunta ficar jogável (ver internal/learning/session.go no monolith,
// que só serve perguntas "approved").
//
// Edição de campo fica fora deste CLI por enquanto — pra corrigir algo (ex.: o bug real de
// correct_answer não bater com nenhuma option, já encontrado e documentado em Docs/CLAUDE.md),
// a via é regenerar ou editar direto no Mongo; volume atual não justifica UI de edição.
//
// Uso: MONGODB_URI=... go run ./cmd/review-questions [-lesson-id=lesson_maquetes_u1]
package main

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"arqlearn/ai-content-pipeline/internal/store"
)

type pendingQuestion struct {
	ID               string   `bson:"_id"`
	LessonID         string   `bson:"lesson_id"`
	Prompt           string   `bson:"prompt"`
	Options          []string `bson:"options"`
	CorrectAnswer    string   `bson:"correct_answer"`
	Explanation      string   `bson:"explanation"`
	Difficulty       string   `bson:"difficulty"`
	Confidence       string   `bson:"confidence"`
	SourceExcerptRef struct {
		Page int `bson:"page"`
	} `bson:"source_excerpt_ref"`
}

func main() {
	lessonID := flag.String("lesson-id", "", "filtra por lição (opcional — vazio revisa todas as pending)")
	flag.Parse()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	mongoClient, db, err := store.Connect(ctx, os.Getenv("MONGODB_URI"), os.Getenv("MONGODB_DATABASE"))
	if err != nil {
		log.Fatalf("falha ao conectar no MongoDB: %v", err)
	}
	defer func() { _ = mongoClient.Disconnect(ctx) }()

	filter := bson.M{"review_status": "pending"}
	if *lessonID != "" {
		filter["lesson_id"] = *lessonID
	}

	cur, err := db.Collection("questions").Find(ctx, filter)
	if err != nil {
		log.Fatalf("falha ao consultar perguntas pendentes: %v", err)
	}
	defer cur.Close(ctx)

	var pending []pendingQuestion
	if err := cur.All(ctx, &pending); err != nil {
		log.Fatalf("falha ao ler perguntas pendentes: %v", err)
	}
	if len(pending) == 0 {
		fmt.Println("nenhuma pergunta pending encontrada.")
		return
	}
	fmt.Printf("%d pergunta(s) pending.\n\n", len(pending))

	reader := bufio.NewReader(os.Stdin)
	approved, rejected, skipped := 0, 0, 0

	for i, q := range pending {
		fmt.Printf("--- [%d/%d] %s (lição %s) ---\n", i+1, len(pending), q.ID, q.LessonID)
		fmt.Printf("Pergunta: %s\n", q.Prompt)
		for j, opt := range q.Options {
			marker := " "
			if opt == q.CorrectAnswer {
				marker = "*"
			}
			fmt.Printf("  %s %c) %s\n", marker, 'a'+j, opt)
		}
		fmt.Printf("Explicação: %s\n", q.Explanation)
		fmt.Printf("Dificuldade: %s | Confiança: %s | Página fonte: %d\n",
			q.Difficulty, q.Confidence, q.SourceExcerptRef.Page)
		fmt.Print("Aprovar (a) / Rejeitar (r) / Pular (s)? ")

		line, _ := reader.ReadString('\n')
		switch strings.ToLower(strings.TrimSpace(line)) {
		case "a":
			if err := setReviewStatus(ctx, db, q.ID, "approved"); err != nil {
				log.Printf("erro ao aprovar %s: %v", q.ID, err)
				continue
			}
			approved++
			fmt.Println("-> aprovada.")
		case "r":
			if err := setReviewStatus(ctx, db, q.ID, "rejected"); err != nil {
				log.Printf("erro ao rejeitar %s: %v", q.ID, err)
				continue
			}
			rejected++
			fmt.Println("-> rejeitada.")
		default:
			skipped++
			fmt.Println("-> pulada.")
		}
		fmt.Println()
	}

	fmt.Printf("Resumo: %d aprovada(s), %d rejeitada(s), %d pulada(s).\n", approved, rejected, skipped)
}

func setReviewStatus(ctx context.Context, db *mongo.Database, questionID, status string) error {
	_, err := db.Collection("questions").UpdateOne(ctx,
		bson.M{"_id": questionID},
		bson.M{"$set": bson.M{"review_status": status, "updated_at": time.Now().UTC()}},
	)
	return err
}
