// Command server é o monólito modular do ArqLearn (fase bootstrap — ver
// Docs/ArqLearn_Estrategia_Bootstrap.md §2). Reúne todos os domínios do SAD §8 num
// único binário, comunicando-se por chamada de função. Extrair um pacote /internal
// para um serviço de verdade é o caminho de migração para a arquitetura-alvo — não
// pular direto para lá sem passar pela extração incremental (ver Docs/CLAUDE.md).
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"arqlearn/monolith/internal/analytics"
	"arqlearn/monolith/internal/authmiddleware"
	"arqlearn/monolith/internal/db"
	"arqlearn/monolith/internal/documentdb"
	"arqlearn/monolith/internal/gamification"
	"arqlearn/monolith/internal/ingestion"
	"arqlearn/monolith/internal/learning"
	"arqlearn/monolith/internal/notifications"
	"arqlearn/monolith/internal/users"
)

func main() {
	// Erro ignorado de propósito: em produção as variáveis vêm do ambiente real, não de um
	// arquivo .env local (que nem existe fora da máquina de desenvolvimento).
	_ = godotenv.Load()

	ctx := context.Background()

	pool, err := db.Connect(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		// Não derruba o processo — rotas que não dependem de banco continuam funcionando,
		// e /ready reporta o problema em vez de mentir que está tudo certo.
		log.Printf("aviso: sem conexão com Postgres: %v", err)
	} else {
		defer pool.Close()
	}

	mongoClient, mongoDB, err := documentdb.Connect(ctx, os.Getenv("MONGODB_URI"), os.Getenv("MONGODB_DATABASE"))
	if err != nil {
		// Mesmo tratamento gracioso do Postgres — ver Docs/ArqLearn_Estrategia_Bootstrap.md.
		log.Printf("aviso: sem conexão com MongoDB: %v", err)
	} else {
		defer func() { _ = mongoClient.Disconnect(ctx) }()
	}

	verifier := authmiddleware.NewVerifier(os.Getenv("SUPABASE_URL"), os.Getenv("SUPABASE_PUBLISHABLE_KEY"))

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", handleHealth)
	mux.HandleFunc("GET /ready", handleReady(pool, mongoClient))

	users.RegisterRoutes(mux, pool, verifier)
	learning.RegisterRoutes(mux, pool, mongoDB, verifier)
	gamification.RegisterRoutes(mux)
	ingestion.RegisterRoutes(mux)
	notifications.RegisterRoutes(mux)
	analytics.RegisterRoutes(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("arqlearn monolith ouvindo em :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

// handleReady reflete a saúde real das conexões com Postgres e MongoDB — nunca responde 200
// se algum pool não existir ou o ping falhar (ver Docs/CLAUDE.md, cada serviço expõe /health
// e /ready).
func handleReady(pool *pgxpool.Pool, mongoClient *mongo.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if pool == nil {
			http.Error(w, "sem conexão com o Postgres (DATABASE_URL ausente)", http.StatusServiceUnavailable)
			return
		}
		if mongoClient == nil {
			http.Error(w, "sem conexão com o MongoDB (MONGODB_URI ausente)", http.StatusServiceUnavailable)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		if err := pool.Ping(ctx); err != nil {
			http.Error(w, "postgres indisponível", http.StatusServiceUnavailable)
			return
		}
		if err := mongoClient.Ping(ctx, nil); err != nil {
			http.Error(w, "mongodb indisponível", http.StatusServiceUnavailable)
			return
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}
}
