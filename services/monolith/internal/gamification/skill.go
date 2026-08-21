// Habilidade adaptativa por tópico (TDD §10) — usada pelo Modo Infinito pra escolher a próxima
// pergunta perto do ponto "Goldilocks" pra quem está respondendo, em vez de aleatória pura.
// Isolado num arquivo próprio pelo mesmo motivo de vip.go/events.go: não fazer gamification.go
// (que já concentra baú/liga/loja) crescer ainda mais.
package gamification

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// AdaptiveDifficultyEnabled: kill-switch da seleção adaptativa inteira, mesmo padrão de
// EventsEnabled/VIPSubscriptionsEnabled — flag de código, não de runtime (sem infra de feature
// flag no projeto ainda). Desligar volta o Modo Infinito pra seleção uniforme aleatória (o
// comportamento de antes desta mudança), sem afetar XP/SRS/vidas/streak.
const AdaptiveDifficultyEnabled = true

// LoadTopicSkill lê skill_score/answers_count de user_topic_skill pro par (userID, topic) —
// (0, 0) quando o usuário ainda não respondeu nada nesse tópico (linha não existe ainda), mesmo
// padrão de default usado em LoadHeartsWithRegen/LoadStreakWithExpiration pra estado que só passa
// a existir na primeira escrita.
func LoadTopicSkill(ctx context.Context, pool *pgxpool.Pool, userID, topic string) (skillScore float64, answersCount int, err error) {
	err = pool.QueryRow(ctx,
		`SELECT skill_score, answers_count FROM user_topic_skill WHERE user_id = $1 AND topic = $2`,
		userID, topic,
	).Scan(&skillScore, &answersCount)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, 0, nil
	}
	if err != nil {
		return 0, 0, err
	}
	return skillScore, answersCount, nil
}

// UpdateTopicSkill lê o estado atual, aplica AtualizarHabilidade e grava o resultado — uma função
// só, não um par Load/Save separado, mesmo formato de AddWeeklyXP/BumpCounters (efeito colateral
// best-effort de handleInfiniteModeAnswer: chamador decide se um erro aqui é só logado, nunca
// falha a resposta de verdade). Devolve o skill novo pra alimentar a escolha da próxima pergunta
// na mesma resposta, sem uma segunda leitura.
func UpdateTopicSkill(ctx context.Context, pool *pgxpool.Pool, userID, topic, difficulty string, correct bool) (newSkill float64, err error) {
	skillAtual, respostasNoTopico, err := LoadTopicSkill(ctx, pool, userID, topic)
	if err != nil {
		return 0, err
	}
	newSkill = AtualizarHabilidade(skillAtual, respostasNoTopico, difficulty, correct)

	_, err = pool.Exec(ctx, `
		INSERT INTO user_topic_skill (user_id, topic, skill_score, answers_count, updated_at)
		VALUES ($1, $2, $3, 1, now())
		ON CONFLICT (user_id, topic) DO UPDATE
		SET skill_score = $3, answers_count = user_topic_skill.answers_count + 1, updated_at = now()
	`, userID, topic, newSkill)
	if err != nil {
		return 0, err
	}
	return newSkill, nil
}
