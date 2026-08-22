package gamification

import "testing"

func TestResolveBetProgress(t *testing.T) {
	casos := []struct {
		nome                 string
		daysCompleted        int
		daysRequired         int
		streakAdvanced       bool
		streakReset          bool
		wantNewDaysCompleted int
		wantStatus           GemBetStatus
	}{
		{"nem avança nem reseta: sem mudança", 2, 7, false, false, 2, GemBetActive},
		{"avança um dia, ainda não bateu a meta", 2, 7, true, false, 3, GemBetActive},
		{"avança o último dia necessário: ganha", 6, 7, true, false, 7, GemBetWon},
		{"avança além do necessário (defensivo): ainda ganha", 6, 5, true, false, 7, GemBetWon},
		{"streak reseta: perde, dias não avançam", 3, 7, false, true, 3, GemBetLost},
		{"reset tem prioridade mesmo se avanço também viesse true", 6, 7, true, true, 6, GemBetLost},
		{"primeiro dia de uma aposta de 1 dia: ganha na hora", 0, 1, true, false, 1, GemBetWon},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			gotDays, gotStatus := ResolveBetProgress(c.daysCompleted, c.daysRequired, c.streakAdvanced, c.streakReset)
			if gotDays != c.wantNewDaysCompleted {
				t.Errorf("newDaysCompleted = %d, esperado %d", gotDays, c.wantNewDaysCompleted)
			}
			if gotStatus != c.wantStatus {
				t.Errorf("newStatus = %q, esperado %q", gotStatus, c.wantStatus)
			}
		})
	}
}
