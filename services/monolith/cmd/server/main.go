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
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"arqlearn/monolith/internal/analytics"
	"arqlearn/monolith/internal/authmiddleware"
	"arqlearn/monolith/internal/bugreports"
	"arqlearn/monolith/internal/corsmiddleware"
	"arqlearn/monolith/internal/db"
	"arqlearn/monolith/internal/documentdb"
	"arqlearn/monolith/internal/gamification"
	"arqlearn/monolith/internal/groqclient"
	"arqlearn/monolith/internal/ingestion"
	"arqlearn/monolith/internal/learning"
	"arqlearn/monolith/internal/notifications"
	"arqlearn/monolith/internal/objectstorage"
	"arqlearn/monolith/internal/questiongen"
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
	groq := groqclient.New(os.Getenv("GROQ_API_KEY"))
	if !groq.Enabled() {
		log.Print("aviso: GROQ_API_KEY ausente — POST /v1/lessons/{lesson_id}/questions/{question_id}/explain responderá 503")
	}

	gemini := questiongen.New(os.Getenv("GEMINI_API_KEY"))
	if !gemini.Enabled() {
		log.Print("aviso: GEMINI_API_KEY ausente — Modo Infinito de Maquetes não vai gerar lotes novos em segundo plano, só reaproveita o pool existente")
	}

	r2 := objectstorage.New(
		os.Getenv("R2_ACCOUNT_ID"), os.Getenv("R2_ACCESS_KEY_ID"), os.Getenv("R2_SECRET_ACCESS_KEY"),
		os.Getenv("R2_S3_ENDPOINT"), os.Getenv("R2_BUCKET_NAME"),
	)
	if !r2.Enabled() {
		log.Print("aviso: credenciais R2 ausentes — POST /v1/uploads responderá 503")
	}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", handleHealth)
	mux.HandleFunc("GET /ready", handleReady(pool, mongoClient))

	users.RegisterRoutes(mux, pool, verifier)
	learning.RegisterRoutes(mux, pool, mongoDB, verifier, groq, gemini)
	gamification.RegisterRoutes(mux, pool, verifier)
	ingestion.RegisterRoutes(mux, pool, verifier, r2)
	notifications.RegisterRoutes(mux, pool, mongoDB, verifier)
	bugreports.RegisterRoutes(mux, pool, mongoDB, verifier)
	analytics.RegisterRoutes(mux)

	// Sem isso, qualquer chamada feita direto do browser (client-side) pro backend real é
	// bloqueada no preflight — ver internal/corsmiddleware. CORS_ALLOWED_ORIGINS vazio = sem
	// origem liberada nenhuma (comportamento anterior); "*" não é aceito de propósito, a lista
	// precisa ser explícita.
	corsOrigins := splitAndTrim(os.Getenv("CORS_ALLOWED_ORIGINS"))
	if len(corsOrigins) == 0 {
		log.Print("aviso: CORS_ALLOWED_ORIGINS ausente — chamadas client-side de apps/web ficarão bloqueadas pelo navegador")
	}
	handler := corsmiddleware.New(corsOrigins)(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("arqlearn monolith ouvindo em :%s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal(err)
	}
}

func splitAndTrim(csv string) []string {
	if csv == "" {
		return nil
	}
	parts := strings.Split(csv, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
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
