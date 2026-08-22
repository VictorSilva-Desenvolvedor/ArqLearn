package gamification

import "testing"

func TestEstudoHojeAposReset(t *testing.T) {
	casos := []struct {
		nome             string
		segundosHoje     int
		segundosHojeDate string
		hojeLocal        string
		want             int
	}{
		{"mesma data mantém o acumulado", 300, "2026-08-22", "2026-08-22", 300},
		{"data diferente reseta pra zero", 300, "2026-08-21", "2026-08-22", 0},
		{"data vazia (nunca estudou) reseta pra zero", 0, "", "2026-08-22", 0},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			if got := EstudoHojeAposReset(c.segundosHoje, c.segundosHojeDate, c.hojeLocal); got != c.want {
				t.Errorf("EstudoHojeAposReset() = %d, esperado %d", got, c.want)
			}
		})
	}
}

func TestClampAnswerStudyMs(t *testing.T) {
	casos := []struct {
		nome   string
		timeMs int
		want   int
	}{
		{"dentro do teto passa direto", 45_000, 45_000},
		{"exatamente no teto passa direto", maxAnswerStudyMs, maxAnswerStudyMs},
		{"acima do teto é capado", 999_999, maxAnswerStudyMs},
		{"negativo vira zero", -100, 0},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			if got := ClampAnswerStudyMs(c.timeMs); got != c.want {
				t.Errorf("ClampAnswerStudyMs(%d) = %d, esperado %d", c.timeMs, got, c.want)
			}
		})
	}
}

func TestMetaDiariaAtingida(t *testing.T) {
	target := DailyGoalTarget{Questions: 10, StudySeconds: 600}
	casos := []struct {
		nome               string
		questoesHoje       int
		segundosEstudoHoje int
		want               bool
	}{
		{"nenhuma métrica bate o alvo", 5, 200, false},
		{"perguntas batem o alvo, minutos não", 10, 0, true},
		{"minutos batem o alvo, perguntas não", 0, 600, true},
		{"as duas métricas batem o alvo", 10, 600, true},
		{"perguntas acima do alvo já basta", 999, 0, true},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			if got := MetaDiariaAtingida(c.questoesHoje, c.segundosEstudoHoje, target); got != c.want {
				t.Errorf("MetaDiariaAtingida(%d, %d) = %v, esperado %v", c.questoesHoje, c.segundosEstudoHoje, got, c.want)
			}
		})
	}
}

func TestTargetForDailyGoalLevel(t *testing.T) {
	// Regular precisa bater exatamente com ChestQuestionsRequired — é o que preserva o
	// comportamento do Baú Diário pra quem nunca escolheu um nível (DEFAULT da coluna).
	target, ok := TargetForDailyGoalLevel(DailyGoalRegular)
	if !ok {
		t.Fatal("TargetForDailyGoalLevel(DailyGoalRegular) deveria existir no catálogo")
	}
	if target.Questions != ChestQuestionsRequired {
		t.Errorf("Regular.Questions = %d, esperado %d (ChestQuestionsRequired)", target.Questions, ChestQuestionsRequired)
	}

	if _, ok := TargetForDailyGoalLevel("nivel_inexistente"); ok {
		t.Error("TargetForDailyGoalLevel deveria devolver ok=false pra um nível fora do catálogo")
	}
}
