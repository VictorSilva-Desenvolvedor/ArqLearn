// Personal Records (TDD §12) — segunda categoria de conquista, distinta dos Awards de
// achievements.go: em vez de comparar contra um limiar fixo do catálogo, compara o valor atual de
// uma métrica contra o próprio recorde anterior do usuário. Duas das quatro métricas reaproveitam
// contadores que já existiam antes desta mudança (streak_best, infinite_correct_streak_best) —
// só xp_day_best/league_best_tier são colunas novas (migration 0021), seguindo a mesma regra:
// nunca duplicar um contador que outro sistema já mantém.
package gamification

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PersonalRecordMetric identifica cada uma das métricas de recorde pessoal — os quatro valores
// possíveis de PersonalRecord.Metric, na mesma ordem em que LoadPersonalRecords os devolve.
type PersonalRecordMetric string

const (
	// PersonalRecordStreakDias reaproveita user_gamification.streak_best (já mantido por
	// AtualizarStreak/AplicarExpiracaoStreak, TDD §5) — maior sequência de dias já alcançada.
	PersonalRecordStreakDias PersonalRecordMetric = "streak_dias"
	// PersonalRecordInfinitoSemErros reaproveita infinite_correct_streak_best (já mantido por
	// BumpInfiniteAnswerCounters, achievements.go) — maior sequência sem errar no Modo Infinito.
	PersonalRecordInfinitoSemErros PersonalRecordMetric = "infinito_sem_erros"
	// PersonalRecordXPDia é o maior xp_today (TDD §3.2) já alcançado num único dia local —
	// xp_today em si reseta todo dia (XPHojeAposReset), então sem esta coluna o pico se perderia.
	PersonalRecordXPDia PersonalRecordMetric = "xp_dia"
	// PersonalRecordLigaAlcancada é o maior rank de liga (1..30, mesma codificação linear de
	// current_tier — ver leagueTierNames/tierName) já alcançado, mesmo que o usuário já tenha
	// rebaixado desde então.
	PersonalRecordLigaAlcancada PersonalRecordMetric = "liga_alcancada"
)

// PersonalRecord é um item de "personal_records" em GET /v1/gamification/me (API Spec §3.2/§8) e
// de "personal_records_broken" nas respostas de resposta de exercício (§6/§6.1) — título/
// descrição/ícone de exibição são conteúdo do cliente (personalRecordCatalog.ts), mesmo padrão de
// Achievement/achievementCatalog.ts.
type PersonalRecord struct {
	Metric PersonalRecordMetric `json:"metric"`
	Value  int                  `json:"value"`
}

// DetectRecord decide se candidate supera previousBest — nunca decresce (um recorde só é
// substituído por um valor maior; empatar não conta como quebrar). Pura e testada
// (personalrecords_test.go) porque é a única regra de negócio real desta feature; toda a leitura/
// escrita ao redor dela é I/O.
func DetectRecord(previousBest, candidate int) (newBest int, broken bool) {
	if candidate > previousBest {
		return candidate, true
	}
	return previousBest, false
}

// LoadPersonalRecords lê as quatro métricas de uma vez (1 SELECT) — chamada por
// GET /v1/gamification/me. streak_best/infinite_correct_streak_best são as mesmas colunas já
// usadas por LoadStreakWithExpiration/achievements.go; xp_day_best/league_best_tier vêm da
// migration 0021.
func LoadPersonalRecords(ctx context.Context, pool *pgxpool.Pool, userID string) ([]PersonalRecord, error) {
	var streakBest, infiniteCorrectStreakBest, xpDayBest, leagueBestTier int
	if err := pool.QueryRow(ctx, `
		SELECT streak_best, infinite_correct_streak_best, xp_day_best, league_best_tier
		FROM user_gamification WHERE user_id = $1
	`, userID).Scan(&streakBest, &infiniteCorrectStreakBest, &xpDayBest, &leagueBestTier); err != nil {
		return nil, err
	}
	return []PersonalRecord{
		{PersonalRecordStreakDias, streakBest},
		{PersonalRecordInfinitoSemErros, infiniteCorrectStreakBest},
		{PersonalRecordXPDia, xpDayBest},
		{PersonalRecordLigaAlcancada, leagueBestTier},
	}, nil
}
