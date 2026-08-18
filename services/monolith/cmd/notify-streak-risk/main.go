// Command notify-streak-risk varre usuários com streak em risco (TDD §5.2/§5.3, StreakEmRisco) e
// manda notificação in-app + push de verdade (Expo Push API) pra quem tem push_enabled e ainda
// não praticou hoje. Não existe job scheduler rodando nesta fase (ver
// Docs/ArqLearn_Estrategia_Bootstrap.md — sem Kubernetes), então este comando é operacional: rodar
// manualmente ou agendar via cron externo (ex.: GitHub Actions scheduled workflow), mesmo padrão
// de cmd/close-league-week.
//
// Uso:
//
//	DATABASE_URL=... MONGODB_URI=... go run ./cmd/notify-streak-risk
//
// MONGODB_DATABASE é opcional (default "arqlearn", mesmo comportamento de documentdb.Connect).
package main

import (
	"context"
	"log"
	"os"

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

	log.Print("verificando streaks em risco...")
	if err := notifications.NotifyStreaksAtRisk(ctx, pool, mongoDB, expo); err != nil {
		log.Fatalf("falha ao notificar streaks em risco: %v", err)
	}
	log.Print("concluído.")
}
