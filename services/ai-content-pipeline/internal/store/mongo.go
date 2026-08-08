// Package store abre a conexão com o MongoDB pros CLIs deste módulo (generate-questions,
// review-questions) — mesmo schema documentado em Docs/ArqLearn_Database_Design.md §4 que o
// monolith usa (internal/documentdb), mas sem pool/health-check: CLI de execução curta, não
// servidor de longa duração.
package store

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// Connect abre a conexão a partir de MONGODB_URI/MONGODB_DATABASE (mesmas variáveis de
// services/monolith/.env — ver Docs/CLAUDE.md).
func Connect(ctx context.Context, uri, databaseName string) (*mongo.Client, *mongo.Database, error) {
	if uri == "" {
		return nil, nil, fmt.Errorf("MONGODB_URI não configurada")
	}
	if databaseName == "" {
		databaseName = "arqlearn"
	}

	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		return nil, nil, fmt.Errorf("conectando ao MongoDB: %w", err)
	}
	if err := client.Ping(ctx, nil); err != nil {
		_ = client.Disconnect(ctx)
		return nil, nil, fmt.Errorf("ping no MongoDB: %w", err)
	}
	return client, client.Database(databaseName), nil
}
