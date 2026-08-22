// Meta Diária (TDD §13) — nível de intensidade escolhido pelo usuário entre 4 presets, medido em
// perguntas certas OU minutos estudados no dia (o que vier primeiro), nunca só em XP (reconcilia
// Docs/ArqLearn_Backlog_Gamificacao_Atelie.md §1.4 / RS-01 em
// Docs/ignorar/Duolingo/REGRAS-gamificacao.md — ver nota completa no TDD sobre por que o streak
// continua desacoplado da meta, ao contrário do RS-02 original). Substitui o gatilho fixo do Baú
// Diário (ChestQuestionsRequired, algorithms.go) por um alvo dinâmico por usuário.
package gamification

// DailyGoalLevel é o nível de intensidade escolhido pelo usuário — os únicos 4 valores aceitos
// pela CHECK constraint de user_gamification.daily_goal_level (migration 0022).
type DailyGoalLevel string

const (
	DailyGoalLeve        DailyGoalLevel = "leve"
	DailyGoalRegular     DailyGoalLevel = "regular"
	DailyGoalConsistente DailyGoalLevel = "consistente"
	DailyGoalIntensa     DailyGoalLevel = "intensa"
)

// DefaultDailyGoalLevel é o valor DEFAULT da coluna — Regular bate exatamente com
// ChestQuestionsRequired (10), preservando o comportamento do Baú Diário pra quem nunca escolheu
// um nível.
const DefaultDailyGoalLevel = DailyGoalRegular

// DailyGoalTarget é quanto o usuário precisa alcançar HOJE, numa métrica OU na outra, pra "vencer
// o dia" — nunca as duas ao mesmo tempo (ver TDD §13: perguntas e minutos são correlacionados
// neste app, diferente de mover/exercitar/ficar em pé do Apple Watch; exigir os dois dobraria a
// exigência sem sinal novo real).
type DailyGoalTarget struct {
	Questions    int
	StudySeconds int
}

// dailyGoalCatalog: calibração inicial (não telemetria real ainda) — revisitar com dados de
// conclusão depois de estar no ar, mesma recomendação do documento de metas diárias §8.
var dailyGoalCatalog = map[DailyGoalLevel]DailyGoalTarget{
	DailyGoalLeve:        {Questions: 3, StudySeconds: 5 * 60},
	DailyGoalRegular:     {Questions: ChestQuestionsRequired, StudySeconds: 12 * 60},
	DailyGoalConsistente: {Questions: 15, StudySeconds: 20 * 60},
	DailyGoalIntensa:     {Questions: 25, StudySeconds: 35 * 60},
}

// TargetForDailyGoalLevel devolve o alvo do nível — o segundo retorno é false pra um nível
// desconhecido (nunca deveria acontecer com a CHECK constraint em vigor, mas o chamador HTTP
// ainda precisa validar entrada de PATCH antes de gravar).
func TargetForDailyGoalLevel(level DailyGoalLevel) (DailyGoalTarget, bool) {
	target, ok := dailyGoalCatalog[level]
	return target, ok
}

// EstudoHojeAposReset espelha QuestoesHojeAposReset (algorithms.go) — reset preguiçoso por
// igualdade de data local, sem job/cron.
func EstudoHojeAposReset(segundosHoje int, segundosHojeDate, hojeLocal string) int {
	if segundosHojeDate != hojeLocal {
		return 0
	}
	return segundosHoje
}

// maxAnswerStudyMs: teto de quanto uma única resposta pode somar ao tempo de estudo do dia (5min)
// — proteção contra o mesmo tipo de gaming trivial que os Personal Records já tratam (um time_ms
// absurdo, ex.: app aberto numa pergunta por horas sem interação real, não pode sozinho bater uma
// meta de minutos). Não valida/rejeita — só limita a contribuição, mesmo espírito não-bloqueante
// do resto da camada de gamificação.
const maxAnswerStudyMs = 5 * 60 * 1000

// ClampAnswerStudyMs aplica o teto acima a um único time_ms de resposta antes de somar ao
// acumulado do dia. Negativo (não deveria acontecer, mas o cliente é quem manda o valor) vira 0.
func ClampAnswerStudyMs(timeMs int) int {
	if timeMs < 0 {
		return 0
	}
	if timeMs > maxAnswerStudyMs {
		return maxAnswerStudyMs
	}
	return timeMs
}

// MetaDiariaAtingida decide se o dia está "vencido" pro alvo informado — perguntas certas OU
// minutos estudados, o que vier primeiro (nunca os dois ao mesmo tempo).
func MetaDiariaAtingida(questoesHoje, segundosEstudoHoje int, target DailyGoalTarget) bool {
	return questoesHoje >= target.Questions || segundosEstudoHoje >= target.StudySeconds
}

// dailyGoalStatusResponse é o formato compartilhado por GET/PATCH /v1/gamification/daily-goal.
type dailyGoalStatusResponse struct {
	Level              DailyGoalLevel `json:"level"`
	QuestionsTarget    int            `json:"questions_target"`
	StudyMinutesTarget int            `json:"study_minutes_target"`
	QuestionsToday     int            `json:"questions_today"`
	StudyMinutesToday  int            `json:"study_minutes_today"`
	Achieved           bool           `json:"achieved"`
}

// buildDailyGoalStatusResponse monta a resposta a partir do estado já lido/resetado — chamada
// pelos handlers de GET e PATCH, uma única fonte de verdade pro formato de resposta.
func buildDailyGoalStatusResponse(level DailyGoalLevel, target DailyGoalTarget, questionsToday, studySecondsToday int) dailyGoalStatusResponse {
	return dailyGoalStatusResponse{
		Level:              level,
		QuestionsTarget:    target.Questions,
		StudyMinutesTarget: target.StudySeconds / 60,
		QuestionsToday:     questionsToday,
		StudyMinutesToday:  studySecondsToday / 60,
		Achieved:           MetaDiariaAtingida(questionsToday, studySecondsToday, target),
	}
}
