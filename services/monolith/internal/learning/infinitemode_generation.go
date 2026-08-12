package learning

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"arqlearn/monolith/internal/questiongen"
)

// generationTopicConfig mapeia cada tópico com texto-fonte real embutido (questiongen.HasSourceText)
// pra sua trilha/unit de destino — únicos tópicos com geração dinâmica real (Docs/PENDENCIAS_IA.md
// #7). Os demais temas do catálogo continuam 100% no pool fixo: gerar "do conhecimento geral" pra
// eles violaria a regra de nunca inventar sem lastro num texto-fonte específico. Adicionar um tópico
// novo aqui exige que questiongen/sourcetext/<topic>/unidade{1..4}.txt exista antes.
type topicGenerationConfig struct {
	trackID string
	unitID  string
}

var generationTopicConfigs = map[string]topicGenerationConfig{
	"maquetes": {
		trackID: "track_s02_maquetes",
		unitID:  "unit_maquetes_infinito",
	},
	"construcoes_sustentaveis": {
		trackID: "track_s01_construcoes_sustentaveis",
		unitID:  "unit_construcoes_sustentaveis_infinito",
	},
	"desenho_arquitetura_urbanismo": {
		trackID: "track_s02_desenho_arquitetura_urbanismo",
		unitID:  "unit_desenho_arquitetura_urbanismo_infinito",
	},
	"projeto_arquitetura_cultural": {
		trackID: "track_s03_projeto_arquitetura_cultural",
		unitID:  "unit_projeto_arquitetura_cultural_infinito",
	},
	"informatica_projecoes_ortogonais": {
		trackID: "track_s03_informatica_projecoes_ortogonais",
		unitID:  "unit_informatica_projecoes_ortogonais_infinito",
	},
}

// genBatchSize/genTriggerAt: a cada 20 perguntas respondidas (nesta sessão) no tópico com geração
// dinâmica, um novo lote de 20 é gerado em segundo plano — disparado na 15ª pra ter ~5 perguntas de
// folga (tempo de leitura/resposta do usuário) antes de o lote atual acabar, evitando espera
// perceptível no botão "Continuar".
const genBatchSize = 20
const genTriggerAt = 15

// genDifficultyMix segue a distribuição 55/30/12/3 (Fácil/Médio/Difícil/Impossível) combinada com
// o usuário pro banco de Maquetes, aplicada a um lote de 20: 11+6+2+1 = 20.
var genDifficultyMix = []struct {
	difficulty string
	count      int
}{
	{"easy", 11},
	{"medium", 6},
	{"hard", 2},
	{"impossible", 1},
}

// generationLockStaleAfter destrava um lote "preso" (goroutine morreu sem limpar, deploy no meio
// da geração etc.) — sem isso, um único lote travado impediria qualquer geração futura pra sempre.
const generationLockStaleAfter = 5 * time.Minute

// generationState espelha a coleção "infinite_mode_generation_state" (nova) — um documento por
// tópico, funcionando como trava simples pra nunca gerar dois lotes em paralelo (evita duplicar
// custo de API se dois usuários cruzarem o limiar quase ao mesmo tempo) e como contador rotativo de
// qual unidade-fonte usar no próximo lote.
type generationState struct {
	ID             string    `bson:"_id"`
	InProgress     bool      `bson:"in_progress"`
	NextUnitNumber int       `bson:"next_unit_number"`
	NextBatchLabel int       `bson:"next_batch_label"`
	UpdatedAt      time.Time `bson:"updated_at"`
}

// maybeTriggerGeneration é chamado a cada resposta de Modo Infinito (handleInfiniteModeAnswer).
// Não bloqueia a resposta HTTP: a checagem de trava é rápida (uma escrita indexada por _id) e a
// geração de verdade roda numa goroutine com contexto próprio, desligado do ciclo de vida da
// requisição HTTP que a disparou.
func maybeTriggerGeneration(mongoDB *mongo.Database, gemini *questiongen.Client, topic string, questionsAnsweredInSession int) {
	config, ok := generationTopicConfigs[topic]
	if !ok || gemini == nil || !gemini.Enabled() || mongoDB == nil {
		return
	}
	if questionsAnsweredInSession%genBatchSize != genTriggerAt {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	staleBefore := time.Now().UTC().Add(-generationLockStaleAfter)
	filter := bson.M{
		"_id": topic,
		"$or": []bson.M{
			{"in_progress": bson.M{"$ne": true}},
			{"updated_at": bson.M{"$lt": staleBefore}},
		},
	}
	update := bson.M{
		"$set":         bson.M{"in_progress": true, "updated_at": time.Now().UTC()},
		"$setOnInsert": bson.M{"next_unit_number": 1, "next_batch_label": 1},
	}
	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)

	var state generationState
	err := mongoDB.Collection("infinite_mode_generation_state").FindOneAndUpdate(ctx, filter, update, opts).Decode(&state)
	if err != nil {
		// Não é um erro real na maioria dos casos: outro processo já detém a trava (in_progress
		// == true e ainda não stale) — próxima vez que alguém cruzar o limiar tenta de novo.
		return
	}

	go generateNextBatch(mongoDB, gemini, topic, config, state.NextUnitNumber, state.NextBatchLabel)
}

// generateNextBatch gera, valida e persiste um lote novo de perguntas (nova Lição permanente,
// anexada à trilha do tópico — API Spec §6.1) e sempre libera a trava ao final, mesmo em erro.
func generateNextBatch(mongoDB *mongo.Database, gemini *questiongen.Client, topic string, config topicGenerationConfig, unitNumber, batchLabel int) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()
	defer releaseGenerationLock(mongoDB, topic, unitNumber)

	sourceText, ok := questiongen.SourceTextForUnit(topic, unitNumber)
	if !ok {
		log.Printf("modo infinito (%s): sem texto-fonte pra unidade %d, pulando geração", topic, unitNumber)
		return
	}

	existingPrompts, err := fetchExistingPrompts(ctx, mongoDB, topic)
	if err != nil {
		log.Printf("modo infinito (%s): falha ao consultar perguntas existentes: %v", topic, err)
		// segue mesmo assim — sem a lista de "não repetir" o risco é de repetição, não de erro fatal
	}

	var generated []questiongen.GeneratedQuestion
	for _, mix := range genDifficultyMix {
		qs, err := gemini.GenerateQuestions(ctx, sourceText, mix.difficulty, mix.count, existingPrompts)
		if err != nil {
			log.Printf("modo infinito (%s): falha ao gerar %d perguntas %q (unidade %d): %v", topic, mix.count, mix.difficulty, unitNumber, err)
			continue
		}
		for _, q := range qs {
			if err := questiongen.Validate(q); err != nil {
				log.Printf("modo infinito (%s): pergunta gerada descartada (%q): %v", topic, q.Prompt, err)
				continue
			}
			generated = append(generated, q)
		}
	}

	if len(generated) == 0 {
		log.Printf("modo infinito (%s): lote %d (unidade %d) não gerou nenhuma pergunta válida", topic, batchLabel, unitNumber)
		return
	}

	if err := persistGeneratedLesson(ctx, mongoDB, topic, config, batchLabel, generated); err != nil {
		log.Printf("modo infinito (%s): falha ao persistir lote %d: %v", topic, batchLabel, err)
		return
	}
	log.Printf("modo infinito (%s): lote %d gerado com sucesso (%d perguntas, unidade-fonte %d)", topic, batchLabel, len(generated), unitNumber)
}

func releaseGenerationLock(mongoDB *mongo.Database, topic string, prevUnitNumber int) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	nextUnit := (prevUnitNumber % 4) + 1
	_, err := mongoDB.Collection("infinite_mode_generation_state").UpdateOne(ctx,
		bson.M{"_id": topic},
		bson.M{
			"$set": bson.M{"in_progress": false, "updated_at": time.Now().UTC(), "next_unit_number": nextUnit},
			"$inc": bson.M{"next_batch_label": 1},
		},
	)
	if err != nil {
		log.Printf("modo infinito (%s): falha ao liberar trava de geração: %v", topic, err)
	}
}

// fetchExistingPrompts lê os prompts já existentes na trilha do tópico (curados + gerados em
// lotes anteriores) pra instruir o Gemini a não repetir — limitado a 200 pra manter o prompt
// dentro de um tamanho razoável. Depende de convenção de nomenclatura (lesson_id sempre começa
// com "lesson_<topic>") — todos os seeds/scripts de geração já seguem isso.
func fetchExistingPrompts(ctx context.Context, mongoDB *mongo.Database, topic string) ([]string, error) {
	cur, err := mongoDB.Collection("questions").Find(ctx,
		bson.M{"lesson_id": bson.M{"$regex": "^lesson_" + topic}},
		options.Find().SetProjection(bson.M{"prompt": 1}).SetLimit(200),
	)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var docs []struct {
		Prompt string `bson:"prompt"`
	}
	if err := cur.All(ctx, &docs); err != nil {
		return nil, err
	}
	prompts := make([]string, len(docs))
	for i, d := range docs {
		prompts[i] = d.Prompt
	}
	return prompts, nil
}

// persistGeneratedLesson cria uma Lição nova de verdade (não efêmera) com as perguntas geradas e a
// anexa à trilha do tópico — é isso que faz o lote "virar nível novo no sistema": qualquer aluno
// no modo de lição normal passa a ver essa lição, não só quem jogou Modo Infinito. Perguntas com
// confidence "high" entram já "approved" (mesma regra do cmd/generate-questions, ver
// Docs/PENDENCIAS_IA.md); "medium"/"low" entram "pending", aguardando revisão humana.
func persistGeneratedLesson(ctx context.Context, mongoDB *mongo.Database, topic string, config topicGenerationConfig, batchLabel int, questions []questiongen.GeneratedQuestion) error {
	now := time.Now().UTC()
	lessonID := fmt.Sprintf("lesson_%s_infinito_%d", topic, batchLabel)

	questionIDs := make([]string, 0, len(questions))
	for i, q := range questions {
		reviewStatus := "pending"
		if q.Confidence == "high" {
			reviewStatus = "approved"
		}
		questionID := fmt.Sprintf("%s_q%02d", lessonID, i+1)
		_, err := mongoDB.Collection("questions").UpdateOne(ctx,
			bson.M{"_id": questionID},
			bson.M{"$setOnInsert": bson.M{
				"_id":              questionID,
				"lesson_id":        lessonID,
				"type":             q.Type,
				"prompt":           q.Prompt,
				"options":          q.Options,
				"correct_answer":   q.CorrectAnswer,
				"explanation":      q.Explanation,
				"difficulty":       q.Difficulty,
				"confidence":       q.Confidence,
				"source_upload_id": nil,
				"review_status":    reviewStatus,
				"created_at":       now,
				"updated_at":       now,
			}},
			options.UpdateOne().SetUpsert(true),
		)
		if err != nil {
			return fmt.Errorf("gravar pergunta %s: %w", questionID, err)
		}
		questionIDs = append(questionIDs, questionID)
	}

	_, err := mongoDB.Collection("lessons").UpdateOne(ctx,
		bson.M{"_id": lessonID},
		bson.M{"$setOnInsert": bson.M{
			"_id":               lessonID,
			"track_id":          config.trackID,
			"title":             fmt.Sprintf("Modo Infinito — Conteúdo gerado #%d", batchLabel),
			"difficulty":        "medium",
			"question_ids":      questionIDs,
			"estimated_minutes": len(questionIDs),
			"created_at":        now,
			"updated_at":        now,
		}},
		options.UpdateOne().SetUpsert(true),
	)
	if err != nil {
		return fmt.Errorf("gravar lição %s: %w", lessonID, err)
	}

	return appendLessonToInfinitoUnit(ctx, mongoDB, config, lessonID, now)
}

// appendLessonToInfinitoUnit anexa lessonID à unidade de Modo Infinito (config.unitID) da trilha
// do tópico (config.trackID), criando a unidade na primeira geração — a ordem é sempre "depois de
// todas as unidades curadas já existentes" (len(units)+1), nunca um número fixo: cada trilha pode
// ter uma quantidade diferente de unidades curadas antes de chegar na primeira geração dinâmica.
func appendLessonToInfinitoUnit(ctx context.Context, mongoDB *mongo.Database, config topicGenerationConfig, lessonID string, now time.Time) error {
	res, err := mongoDB.Collection("tracks").UpdateOne(ctx,
		bson.M{"_id": config.trackID, "units.id": config.unitID},
		bson.M{
			"$push": bson.M{"units.$.lesson_ids": lessonID},
			"$set":  bson.M{"updated_at": now},
		},
	)
	if err != nil {
		return err
	}
	if res.MatchedCount > 0 {
		return nil
	}

	var track struct {
		Units []bson.M `bson:"units"`
	}
	if err := mongoDB.Collection("tracks").FindOne(ctx, bson.M{"_id": config.trackID}, options.FindOne().SetProjection(bson.M{"units": 1})).Decode(&track); err != nil {
		return fmt.Errorf("consultar units da trilha %s: %w", config.trackID, err)
	}

	_, err = mongoDB.Collection("tracks").UpdateOne(ctx,
		bson.M{"_id": config.trackID},
		bson.M{
			"$push": bson.M{"units": bson.M{
				"id":         config.unitID,
				"title":      "Conteúdo gerado pelo Modo Infinito",
				"order":      len(track.Units) + 1,
				"lesson_ids": []string{lessonID},
			}},
			"$set": bson.M{"updated_at": now},
		},
	)
	return err
}
