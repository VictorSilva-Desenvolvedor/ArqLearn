// Command ensure-event-partitions garante que gamification_events (particionada por mês,
// migrations/0001_init) tenha partição criada para o mês corrente e os próximos meses. Sem uma
// partição cobrindo a data, INSERT em gamification_events falha assim que o mês vira — a tabela
// nasceu só com a partição de agosto/2026, e migrations/0016 cobriu set/out/nov como colchão
// inicial; este comando existe pra não depender de lembrar de criar mais uma migration a cada
// virada de trimestre.
//
// Idempotente (CREATE TABLE IF NOT EXISTS) — seguro rodar mais de uma vez ou correr atrasado.
// Pensado pra rodar 1x por mês — ver .github/workflows/ensure-event-partitions.yml. Também roda
// manualmente:
//
//	DATABASE_URL=... go run ./cmd/ensure-event-partitions
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"

	"arqlearn/monolith/internal/db"
)

// monthsAhead: quantos meses à frente do corrente garantir partição — folga o suficiente pra um
// cron mensal atrasado (ou pausado por um tempo) não derrubar um INSERT real.
const monthsAhead = 3

func main() {
	_ = godotenv.Load()

	ctx := context.Background()
	pool, err := db.Connect(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("sem conexão com Postgres: %v", err)
	}
	defer pool.Close()

	now := time.Now().UTC()
	start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	for i := 0; i <= monthsAhead; i++ {
		from := start.AddDate(0, i, 0)
		to := from.AddDate(0, 1, 0)
		name := fmt.Sprintf("gamification_events_%04d_%02d", from.Year(), int(from.Month()))
		stmt := fmt.Sprintf(
			`CREATE TABLE IF NOT EXISTS %s PARTITION OF gamification_events FOR VALUES FROM ('%s') TO ('%s')`,
			name, from.Format("2006-01-02"), to.Format("2006-01-02"),
		)
		if _, err := pool.Exec(ctx, stmt); err != nil {
			log.Fatalf("falha ao garantir partição %s: %v", name, err)
		}
		log.Printf("ok: partição %s (%s a %s)", name, from.Format("2006-01-02"), to.Format("2006-01-02"))
	}
}
