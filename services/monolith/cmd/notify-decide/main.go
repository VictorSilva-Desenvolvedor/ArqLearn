// Command notify-decide roda o laço de decisão de notificação (TDD §11) — substitui o antigo
// cmd/notify-streak-risk (nunca tinha sido ligado a nenhum scheduler, confirmado morto na
// prática). Por rodada: avalia a recompensa de envios passados (bandit de template) e decide, pra
// cada candidato a streak em risco, se manda uma notificação nova — respeitando a janela horária
// local configurável (TDD §5.2), o cooldown de template e o teto diário (RX-05). Pensado pra
// rodar de hora em hora — ver .github/workflows/notify-decide.yml.
//
// Uso:
//
//	DATABASE_URL=... MONGODB_URI=... go run ./cmd/notify-decide
//
// MONGODB_DATABASE é opcional (default "arqlearn", mesmo comportamento de documentdb.Connect).
package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"

	"arqlearn/monolith/internal/db"
	"arqlearn/monolith/internal/documentdb"
	"arqlearn/monolith/internal/expoclient"
	"arqlearn/monolith/internal/notifications"
)

func main() {
	_ = godotenv.Load()

	ctx := context.Background()
	pool, err := db.Connect(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("sem conexão com Postgres: %v", err)
	}
	defer pool.Close()

	mongoClient, mongoDB, err := documentdb.Connect(ctx, os.Getenv("MONGODB_URI"), os.Getenv("MONGODB_DATABASE"))
	if err != nil {
		log.Fatalf("sem conexão com MongoDB: %v", err)
	}
	defer func() { _ = mongoClient.Disconnect(ctx) }()

	expo := expoclient.New()

	log.Print("decidindo notificações...")
	if err := notifications.Decide(ctx, pool, mongoDB, expo, time.Now().UTC()); err != nil {
		log.Fatalf("falha ao decidir notificações: %v", err)
	}
	log.Print("concluído.")
}
