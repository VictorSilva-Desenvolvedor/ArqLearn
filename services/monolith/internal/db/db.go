// Package db gerencia a conexão com o Postgres (Supabase, via connection pooler — ver
// Docs/ArqLearn_Estrategia_Bootstrap.md §3). Usado para o schema documentado em
// Docs/ArqLearn_Database_Design.md — não confundir com a Data API/PostgREST do Supabase,
// que não é usada por este serviço.
package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Connect abre o pool de conexões a partir de DATABASE_URL (connection string do Supabase
// pooler — ver services/monolith/.env.example). Retorna erro em vez de log.Fatal para que o
// chamador decida como lidar com a falha (ex.: /ready responder não-pronto).
func Connect(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL não configurada")
	}

	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parseando DATABASE_URL: %w", err)
	}

	// O Supabase pooler (Supavisor) usado na fase bootstrap roda em transaction mode
	// (porta 6543) — conexões físicas do Postgres são compartilhadas entre sessões lógicas
	// diferentes, então prepared statements nomeados (o cache padrão do pgx) colidem entre
	// clientes distintos ("prepared statement already exists"). Descoberto rodando a
	// migration de verdade contra o projeto, não é uma precaução teórica. Simple protocol
	// evita esse cache — custo de performance irrelevante no volume da fase bootstrap.
	cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("criando pool de conexões: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping no Postgres: %w", err)
	}
	return pool, nil
}
