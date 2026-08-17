// Command close-league-week roda o fechamento semanal de ligas (TDD §6,
// internal/gamification.CloseLeagueWeek) contra o Postgres apontado por DATABASE_URL. Não existe
// job scheduler rodando nesta fase (ver Docs/ArqLearn_Estrategia_Bootstrap.md — sem Kubernetes),
// então este comando é operacional: rodar manualmente ou agendar via cron externo (ex.: GitHub
// Actions scheduled workflow) toda segunda-feira de madrugada, depois que a semana anterior já
// fechou de verdade.
//
// Uso:
//
//	DATABASE_URL=... go run ./cmd/close-league-week [-week=2026-08-10]
//
// -week (opcional, formato AAAA-MM-DD) é a semana a fechar — aceita qualquer dia dessa semana,
// normalizado internamente pra segunda-feira (mesma lógica de mondayOf). Sem a flag, fecha a
// semana anterior à atual (a mais recente que já deveria ter terminado).
package main

import (
	"context"
	"flag"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"

	"arqlearn/monolith/internal/db"
	"arqlearn/monolith/internal/gamification"
)

func main() {
	weekFlag := flag.String("week", "", "dia (AAAA-MM-DD) de qualquer data dentro da semana a fechar; default: semana anterior à atual")
	flag.Parse()

	_ = godotenv.Load()

	ctx := context.Background()
	pool, err := db.Connect(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("sem conexão com Postgres: %v", err)
	}
	defer pool.Close()

	week := time.Now().UTC().AddDate(0, 0, -7)
	if *weekFlag != "" {
		parsed, err := time.Parse("2006-01-02", *weekFlag)
		if err != nil {
			log.Fatalf("-week inválida (use AAAA-MM-DD): %v", err)
		}
		week = parsed
	}

	log.Printf("fechando semana de liga de referência %s...", week.Format("2006-01-02"))
	if err := gamification.CloseLeagueWeek(ctx, pool, week); err != nil {
		log.Fatalf("falha ao fechar semana: %v", err)
	}
	log.Print("fechamento concluído.")
}
