// Command simulate-bot-activity concede XP semanal aleatório aos jogadores bot (users.is_bot =
// true, criados por cmd/seed-league-bots), simulando atividade contínua ao longo da semana — sem
// isso, o placar da Liga travaria estático no valor do seed e um usuário real ultrapassaria todo
// mundo de uma vez só. Reaproveita gamification.AddWeeklyXP, a mesma função do fluxo real de
// resposta correta — os bots entram no fechamento semanal (cmd/close-league-week) e
// promovem/rebaixam de divisão exatamente como um jogador real.
//
// Sem scheduler nesta fase bootstrap (mesmo racional de cmd/close-league-week) — rodar manualmente
// ou agendar via cron externo algumas vezes por dia.
//
// Uso:
//
//	DATABASE_URL=... go run ./cmd/simulate-bot-activity
package main

import (
	"context"
	"log"
	"math/rand"
	"os"

	"github.com/joho/godotenv"

	"arqlearn/monolith/internal/db"
	"arqlearn/monolith/internal/gamification"
)

// activityChance: nem todo bot ganha XP a cada rodada — dá variação de ritmo entre eles em vez de
// todos subirem o mesmo tanto toda vez que o comando roda.
const activityChance = 0.6

func main() {
	_ = godotenv.Load()

	ctx := context.Background()
	pool, err := db.Connect(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("sem conexão com Postgres: %v", err)
	}
	defer pool.Close()

	rows, err := pool.Query(ctx, `SELECT id FROM users WHERE is_bot = true`)
	if err != nil {
		log.Fatalf("falha ao listar bots: %v", err)
	}
	var botIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			log.Fatalf("falha ao ler bot: %v", err)
		}
		botIDs = append(botIDs, id)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		log.Fatalf("falha ao listar bots: %v", err)
	}

	active := 0
	for _, id := range botIDs {
		if rand.Float64() > activityChance {
			continue
		}
		xp := 5 + rand.Intn(36) // 5..40
		if err := gamification.AddWeeklyXP(ctx, pool, id, xp); err != nil {
			log.Printf("aviso: falha ao dar XP ao bot %s: %v", id, err)
			continue
		}
		active++
	}

	log.Printf("concluído: %d/%d bots ganharam XP nesta rodada.", active, len(botIDs))
}
