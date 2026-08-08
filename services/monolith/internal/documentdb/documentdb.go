// Package documentdb gerencia a conexão com o MongoDB (Atlas — ver
// Docs/ArqLearn_Estrategia_Bootstrap.md §3). Usado para o schema documentado em
// Docs/ArqLearn_Database_Design.md §4: tracks, lessons, questions, user_progress,
// infinite_mode_sessions, content_summaries, material_chat_messages.
package documentdb

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// Connect abre a conexão a partir de MONGODB_URI (connection string do Atlas — ver
// services/monolith/.env.example) e retorna o *mongo.Database já selecionado. Erro em vez de
// log.Fatal para que o chamador decida como lidar com a falha (ex.: /ready responder
// não-pronto), mesmo padrão de internal/db.
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
