package gamification

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Counters espelha os contadores vitalícios de user_gamification (migrations/0006) usados pra
// avaliar condições de desbloqueio — sempre a foto mais recente, devolvida pelo mesmo UPDATE que
// incrementou o contador (ver bumpCounters/BumpInfiniteAnswerCounters), nunca uma leitura separada.
type Counters struct {
	LessonsCompletedTotal     int
	AnswersCorrectTotal       int
	PerfectLessonsTotal       int
	ExplainUsedTotal          int
	InfiniteQuestionsTotal    int
	InfiniteCorrectStreakBest int
	InfiniteSessionsTotal     int
	StreakBest                int
	ShopPurchasesTotal        int
	GemsSpentTotal            int
	UploadsTotal              int
	SummariesGeneratedTotal   int
	MaterialChatMessagesTotal int
	BugReportsTotal           int
	BugReportsResolvedTotal   int
}

type singleAchievement struct {
	typ      string
	unlocked func(Counters) bool
}

// tierFamily descreve uma conquista que se repete em 5 níveis — cada nível vira seu próprio
// "type" (ex.: "infinito_sem_erros_1".."infinito_sem_erros_5"), já que o schema de achievements
// (UNIQUE user_id+type) trata cada nível como um desbloqueio independente.
type tierFamily struct {
	base       string
	thresholds [5]int
	value      func(Counters) int
}

// singleAchievements: marcos de "primeira vez", um só nível.
var singleAchievements = []singleAchievement{
	{"primeira_licao", func(c Counters) bool { return c.LessonsCompletedTotal >= 1 }},
	{"licao_perfeita", func(c Counters) bool { return c.PerfectLessonsTotal >= 1 }},
	{"explique_melhor", func(c Counters) bool { return c.ExplainUsedTotal >= 1 }},
	{"infinito_10_perguntas", func(c Counters) bool { return c.InfiniteQuestionsTotal >= 10 }},
	{"primeira_compra", func(c Counters) bool { return c.ShopPurchasesTotal >= 1 }},
	{"primeiro_material", func(c Counters) bool { return c.UploadsTotal >= 1 }},
	{"primeiro_resumo", func(c Counters) bool { return c.SummariesGeneratedTotal >= 1 }},
	{"primeiro_bug", func(c Counters) bool { return c.BugReportsTotal >= 1 }},
	{"bug_corrigido", func(c Counters) bool { return c.BugReportsResolvedTotal >= 1 }},
}

// tierFamilies: conquistas repetíveis, 5 níveis cada, limiar crescente (pedido explícito do
// usuário — "cada conquista que se repete vai ter níveis").
var tierFamilies = []tierFamily{
	{"licoes_completas", [5]int{5, 15, 30, 60, 100}, func(c Counters) int { return c.LessonsCompletedTotal }},
	{"respostas_certas", [5]int{50, 150, 300, 600, 1000}, func(c Counters) int { return c.AnswersCorrectTotal }},
	{"infinito_sem_erros", [5]int{10, 25, 50, 100, 200}, func(c Counters) int { return c.InfiniteCorrectStreakBest }},
	{"infinito_sessoes", [5]int{10, 25, 50, 100, 200}, func(c Counters) int { return c.InfiniteSessionsTotal }},
	{"streak_dias", [5]int{7, 14, 30, 60, 100}, func(c Counters) int { return c.StreakBest }},
	{"gemas_gastas", [5]int{50, 150, 300, 600, 1000}, func(c Counters) int { return c.GemsSpentTotal }},
	{"chat_material", [5]int{5, 15, 30, 60, 100}, func(c Counters) int { return c.MaterialChatMessagesTotal }},
}

// tierXPRewards/tierGemsRewards: recompensa cresce com o nível (índice 0 = nível 1), igual em
// todas as famílias de nível — mantém a economia previsível em vez de valores arbitrários por
// família. Recompensas de conquistas não passam pelo limite diário de XP (TDD §3.2, que é
// especificamente sobre XP de resposta de exercício) — são um crédito direto em xp_total/gems.
var tierXPRewards = [5]int{20, 40, 80, 150, 300}
var tierGemsRewards = [5]int{5, 8, 15, 25, 50}

// singleRewards: recompensa fixa por type — a maioria usa o mesmo valor, alguns marcos merecem
// mais (licao_perfeita já existia antes desta conquista virar real e mantém o valor original do
// catálogo do frontend; bug_corrigido é mais raro/valioso que os demais).
var singleRewards = map[string][2]int{ // type -> {xp, gems}
	"primeira_licao":        {10, 2},
	"licao_perfeita":        {25, 5},
	"explique_melhor":       {15, 3},
	"infinito_10_perguntas": {15, 3},
	"primeira_compra":       {15, 3},
	"primeiro_material":     {15, 3},
	"primeiro_resumo":       {15, 3},
	"primeiro_bug":          {15, 3},
	"bug_corrigido":         {30, 10},
}

// candidateTypes devolve todo type cuja condição já está satisfeita pelos contadores atuais —
// inclui os já desbloqueados (o INSERT ON CONFLICT DO NOTHING em EvaluateAndUnlock cuida da
// idempotência, mais simples que rastrear "o que é novo" aqui).
func candidateTypes(c Counters) []string {
	var types []string
	for _, a := range singleAchievements {
		if a.unlocked(c) {
			types = append(types, a.typ)
		}
	}
	for _, f := range tierFamilies {
		v := f.value(c)
		for i, threshold := range f.thresholds {
			if v >= threshold {
				types = append(types, fmt.Sprintf("%s_%d", f.base, i+1))
			}
		}
	}
	return types
}

func rewardFor(typ string) (xp int, gems int) {
	for _, f := range tierFamilies {
		for i := range f.thresholds {
			if typ == fmt.Sprintf("%s_%d", f.base, i+1) {
				return tierXPRewards[i], tierGemsRewards[i]
			}
		}
	}
	if r, ok := singleRewards[typ]; ok {
		return r[0], r[1]
	}
	return 0, 0
}

// EvaluateAndUnlock confere os contadores atuais contra o catálogo inteiro e grava qualquer
// conquista recém-satisfeita (INSERT ... ON CONFLICT DO NOTHING RETURNING type identifica
// exatamente quais são novas nesta chamada — as demais já estavam desbloqueadas, sem custo extra
// de comparar antes). Cada desbloqueio novo credita XP/gemas uma única vez. Chamada não bloqueia
// a resposta do handler que a disparou — mesmo padrão de AddWeeklyXP: falha aqui não deve derrubar
// uma ação que já foi concedida de verdade (resposta certa, compra etc.).
func EvaluateAndUnlock(ctx context.Context, pool *pgxpool.Pool, userID string, c Counters) ([]string, error) {
	types := candidateTypes(c)
	if len(types) == 0 {
		return nil, nil
	}

	query := `INSERT INTO achievements (user_id, type) VALUES `
	args := []any{userID}
	for i, t := range types {
		if i > 0 {
			query += ", "
		}
		args = append(args, t)
		query += fmt.Sprintf("($1, $%d)", len(args))
	}
	query += ` ON CONFLICT (user_id, type) DO NOTHING RETURNING type`

	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var newlyUnlocked []string
	totalXP, totalGems := 0, 0
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err != nil {
			return nil, err
		}
		newlyUnlocked = append(newlyUnlocked, t)
		xp, gems := rewardFor(t)
		totalXP += xp
		totalGems += gems
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if totalGems > 0 {
		// VIPGemsMultiplier (a pedido do usuário, 19/08/2026): dobra gemas de recompensa de
		// conquista. Consulta extra pontual — só quando há gema pra conceder, não em toda
		// avaliação de conquista (a maioria não desbloqueia nada).
		var isVip bool
		var vipExpiresAt *time.Time
		if err := pool.QueryRow(ctx,
			`SELECT is_vip, vip_expires_at FROM user_gamification WHERE user_id = $1`, userID,
		).Scan(&isVip, &vipExpiresAt); err != nil {
			return newlyUnlocked, err
		}
		if EhVIPAtivo(isVip, vipExpiresAt, time.Now().UTC()) {
			totalGems *= VIPGemsMultiplier
		}
	}

	if totalXP > 0 || totalGems > 0 {
		if _, err := pool.Exec(ctx,
			`UPDATE user_gamification SET xp_total = xp_total + $1, gems = gems + $2 WHERE user_id = $3`,
			totalXP, totalGems, userID,
		); err != nil {
			return newlyUnlocked, err
		}
	}

	return newlyUnlocked, nil
}

// counterColumns lista, na ordem exata em que aparecem em toda query RETURNING deste arquivo, as
// colunas que compõem Counters — centralizado aqui pra bumpCounters e BumpInfiniteAnswerCounters
// nunca divergirem da ordem de scan.
const counterColumns = `lessons_completed_total, answers_correct_total, perfect_lessons_total,
	explain_used_total, infinite_questions_total, infinite_correct_streak_best,
	infinite_sessions_total, streak_best, shop_purchases_total, gems_spent_total, uploads_total,
	summaries_generated_total, material_chat_messages_total, bug_reports_total,
	bug_reports_resolved_total`

func scanCounters(row interface {
	Scan(dest ...any) error
}) (Counters, error) {
	var c Counters
	err := row.Scan(&c.LessonsCompletedTotal, &c.AnswersCorrectTotal, &c.PerfectLessonsTotal,
		&c.ExplainUsedTotal, &c.InfiniteQuestionsTotal, &c.InfiniteCorrectStreakBest,
		&c.InfiniteSessionsTotal, &c.StreakBest, &c.ShopPurchasesTotal, &c.GemsSpentTotal,
		&c.UploadsTotal, &c.SummariesGeneratedTotal, &c.MaterialChatMessagesTotal,
		&c.BugReportsTotal, &c.BugReportsResolvedTotal)
	return c, err
}

// CounterDeltas: quanto somar a cada contador simples nesta chamada (0 = sem mudança). Não inclui
// os contadores de Modo Infinito por pergunta (infinite_questions_total/
// infinite_correct_streak_current/best) — esses têm lógica de CASE (zera a sequência ao errar),
// tratada à parte em BumpInfiniteAnswerCounters.
type CounterDeltas struct {
	LessonsCompleted     int
	AnswersCorrect       int
	PerfectLessons       int
	ExplainUsed          int
	InfiniteSessions     int
	ShopPurchases        int
	GemsSpent            int
	Uploads              int
	SummariesGenerated   int
	MaterialChatMessages int
	BugReports           int
	BugReportsResolved   int
}

// BumpCounters soma cada delta (0 = sem mudança) num único UPDATE atômico e devolve todos os
// contadores já atualizados, prontos pra EvaluateAndUnlock — evita uma segunda ida ao banco só
// pra ler de volta o que acabou de gravar.
func BumpCounters(ctx context.Context, pool *pgxpool.Pool, userID string, d CounterDeltas) (Counters, error) {
	row := pool.QueryRow(ctx, `
		UPDATE user_gamification SET
			lessons_completed_total = lessons_completed_total + $2,
			answers_correct_total = answers_correct_total + $3,
			perfect_lessons_total = perfect_lessons_total + $4,
			explain_used_total = explain_used_total + $5,
			infinite_sessions_total = infinite_sessions_total + $6,
			shop_purchases_total = shop_purchases_total + $7,
			gems_spent_total = gems_spent_total + $8,
			uploads_total = uploads_total + $9,
			summaries_generated_total = summaries_generated_total + $10,
			material_chat_messages_total = material_chat_messages_total + $11,
			bug_reports_total = bug_reports_total + $12,
			bug_reports_resolved_total = bug_reports_resolved_total + $13
		WHERE user_id = $1
		RETURNING `+counterColumns,
		userID, d.LessonsCompleted, d.AnswersCorrect, d.PerfectLessons, d.ExplainUsed,
		d.InfiniteSessions, d.ShopPurchases, d.GemsSpent, d.Uploads, d.SummariesGenerated,
		d.MaterialChatMessages, d.BugReports, d.BugReportsResolved,
	)
	return scanCounters(row)
}

// BumpInfiniteAnswerCounters atualiza os contadores por pergunta do Modo Infinito — a sequência
// sem errar (current/best) usa CASE dentro do próprio UPDATE (atômico, sem race de ler-then-
// escrever): incrementa se a resposta foi certa, zera se foi errada, e best acompanha o maior
// valor já alcançado.
func BumpInfiniteAnswerCounters(ctx context.Context, pool *pgxpool.Pool, userID string, correct bool) (Counters, error) {
	row := pool.QueryRow(ctx, `
		UPDATE user_gamification SET
			infinite_questions_total = infinite_questions_total + 1,
			infinite_correct_streak_current = CASE WHEN $2 THEN infinite_correct_streak_current + 1 ELSE 0 END,
			infinite_correct_streak_best = GREATEST(
				infinite_correct_streak_best,
				CASE WHEN $2 THEN infinite_correct_streak_current + 1 ELSE 0 END
			)
		WHERE user_id = $1
		RETURNING `+counterColumns,
		userID, correct,
	)
	return scanCounters(row)
}
