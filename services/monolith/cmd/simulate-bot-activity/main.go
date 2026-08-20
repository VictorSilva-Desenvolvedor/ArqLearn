// Command simulate-bot-activity aplica uma variação diária de XP aos jogadores bot (users.is_bot =
// true, criados por cmd/seed-league-bots): cada bot recebe um delta aleatório entre -50 e +50 no
// league_members.xp_this_week da semana corrente (a pedido do usuário, 20/08/2026). Sem isso, o
// placar da Liga travaria estático no valor do seed e um usuário real ultrapassaria todo mundo de
// uma vez só. Reaproveita gamification.AdjustWeeklyXP — os bots entram no fechamento semanal
// (cmd/close-league-week) e promovem/rebaixam de divisão exatamente como um jogador real.
//
// Pensado pra rodar uma vez por dia — ver .github/workflows/simulate-bot-activity.yml (cron
// diário). Também pode ser rodado manualmente:
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

// xpDeltaRange: delta diário sorteado em [-xpDeltaRange, +xpDeltaRange] — pedido do usuário
// (20/08/2026): "diferença de 50 xp positivo e 50 xp negativo".
const xpDeltaRange = 50

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

	updated := 0
	for _, id := range botIDs {
		delta := rand.Intn(2*xpDeltaRange+1) - xpDeltaRange // -50..+50
		if err := gamification.AdjustWeeklyXP(ctx, pool, id, delta); err != nil {
			log.Printf("aviso: falha ao ajustar XP do bot %s: %v", id, err)
			continue
		}
		updated++
	}

	log.Printf("concluído: %d/%d bots tiveram o xp_this_week ajustado (delta diário -%d..+%d).", updated, len(botIDs), xpDeltaRange, xpDeltaRange)
}
