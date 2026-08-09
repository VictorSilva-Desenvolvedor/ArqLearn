// Command review-questions lista perguntas com review_status "pending" (geradas por
// cmd/generate-questions com confidence "medium"/"low" — "high" já entra "approved" direto, ver
// Docs/PENDENCIAS_IA.md #5) e permite aprovar, rejeitar ou editar uma a uma pelo terminal — o
// portão de segurança antes de uma pergunta ficar jogável (ver internal/learning/session.go no
// monolith, que só serve perguntas "approved").
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

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
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
		switch reviewOneQuestion(ctx, db, reader, i+1, len(pending), q) {
		case "approved":
			approved++
		case "rejected":
			rejected++
		default:
			skipped++
		}
	}

	fmt.Printf("Resumo: %d aprovada(s), %d rejeitada(s), %d pulada(s).\n", approved, rejected, skipped)
}

// reviewOneQuestion mostra a pergunta e pede uma ação; "e" (editar) fica num laço interno — edita
// e volta a mostrar a versão atualizada, pedindo ação de novo, até o usuário aprovar/rejeitar/pular.
func reviewOneQuestion(ctx context.Context, db *mongo.Database, reader *bufio.Reader, idx, total int, q pendingQuestion) string {
	for {
		printQuestion(idx, total, q)
		fmt.Print("Aprovar (a) / Rejeitar (r) / Editar (e) / Pular (s)? ")
		line, _ := reader.ReadString('\n')

		switch strings.ToLower(strings.TrimSpace(line)) {
		case "a":
			if err := setReviewStatus(ctx, db, q.ID, "approved"); err != nil {
				log.Printf("erro ao aprovar %s: %v", q.ID, err)
				return "skipped"
			}
			fmt.Println("-> aprovada.")
			fmt.Println()
			return "approved"
		case "r":
			if err := setReviewStatus(ctx, db, q.ID, "rejected"); err != nil {
				log.Printf("erro ao rejeitar %s: %v", q.ID, err)
				return "skipped"
			}
			fmt.Println("-> rejeitada.")
			fmt.Println()
			return "rejected"
		case "e":
			edited, err := editQuestion(reader, q)
			if err != nil {
				fmt.Printf("edição cancelada: %v\n\n", err)
				continue
			}
			if err := saveEditedQuestion(ctx, db, edited); err != nil {
				log.Printf("erro ao salvar edição de %s: %v", q.ID, err)
				continue
			}
			q = edited
			fmt.Println("-> edição salva.")
			fmt.Println()
			continue
		default:
			fmt.Println("-> pulada.")
			fmt.Println()
			return "skipped"
		}
	}
}

func printQuestion(idx, total int, q pendingQuestion) {
	fmt.Printf("--- [%d/%d] %s (lição %s) ---\n", idx, total, q.ID, q.LessonID)
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
}

// editQuestion pede um novo valor por campo — Enter em branco mantém o valor atual. Reprova a
// mesma checagem de geminiclient.Validate() (correct_answer precisa bater exatamente com uma
// option) antes de aceitar a edição, pelo mesmo motivo: é o bug real já documentado que motivou
// este CLI existir.
func editQuestion(reader *bufio.Reader, q pendingQuestion) (pendingQuestion, error) {
	fmt.Println("Editando — Enter em branco mantém o valor atual.")

	if v := promptLine(reader, fmt.Sprintf("Pergunta [%s]: ", q.Prompt)); v != "" {
		q.Prompt = v
	}

	newOptions := make([]string, len(q.Options))
	copy(newOptions, q.Options)
	for i := range newOptions {
		if v := promptLine(reader, fmt.Sprintf("Opção %c [%s]: ", 'a'+i, newOptions[i])); v != "" {
			newOptions[i] = v
		}
	}
	q.Options = newOptions

	if v := promptLine(reader, fmt.Sprintf("Letra da opção correta [atual: %s]: ", correctLetter(q))); v != "" {
		idx := int(strings.ToLower(v)[0] - 'a')
		if idx < 0 || idx >= len(q.Options) {
			return q, fmt.Errorf("letra inválida: %q", v)
		}
		q.CorrectAnswer = q.Options[idx]
	}

	if v := promptLine(reader, fmt.Sprintf("Explicação [%s]: ", q.Explanation)); v != "" {
		q.Explanation = v
	}

	if !containsOption(q.Options, q.CorrectAnswer) {
		return q, fmt.Errorf("correct_answer não bate com nenhuma option após a edição — nada foi salvo")
	}
	return q, nil
}

func promptLine(reader *bufio.Reader, label string) string {
	fmt.Print(label)
	line, _ := reader.ReadString('\n')
	return strings.TrimSpace(line)
}

func correctLetter(q pendingQuestion) string {
	for i, opt := range q.Options {
		if opt == q.CorrectAnswer {
			return string(rune('a' + i))
		}
	}
	return "?"
}

func containsOption(options []string, answer string) bool {
	for _, o := range options {
		if o == answer {
			return true
		}
	}
	return false
}

func setReviewStatus(ctx context.Context, db *mongo.Database, questionID, status string) error {
	_, err := db.Collection("questions").UpdateOne(ctx,
		bson.M{"_id": questionID},
		bson.M{"$set": bson.M{"review_status": status, "updated_at": time.Now().UTC()}},
	)
	return err
}

func saveEditedQuestion(ctx context.Context, db *mongo.Database, q pendingQuestion) error {
	_, err := db.Collection("questions").UpdateOne(ctx,
		bson.M{"_id": q.ID},
		bson.M{"$set": bson.M{
			"prompt":         q.Prompt,
			"options":        q.Options,
			"correct_answer": q.CorrectAnswer,
			"explanation":    q.Explanation,
			"updated_at":     time.Now().UTC(),
		}},
	)
	return err
}
