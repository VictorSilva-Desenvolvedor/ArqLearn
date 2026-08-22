package gamification

import "testing"

func TestDetectRecord(t *testing.T) {
	casos := []struct {
		nome         string
		previousBest int
		candidate    int
		wantNewBest  int
		wantBroken   bool
	}{
		{"candidato maior quebra o recorde", 10, 15, 15, true},
		{"candidato igual não quebra", 10, 10, 10, false},
		{"candidato menor não quebra", 10, 5, 10, false},
		{"recorde zerado (usuário novo) e primeiro valor positivo quebra", 0, 1, 1, true},
		{"candidato zero contra recorde zero não quebra", 0, 0, 0, false},
		{"candidato negativo nunca quebra um recorde positivo", 10, -5, 10, false},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			newBest, broken := DetectRecord(c.previousBest, c.candidate)
			if newBest != c.wantNewBest {
				t.Errorf("newBest = %d, esperado %d", newBest, c.wantNewBest)
			}
			if broken != c.wantBroken {
				t.Errorf("broken = %v, esperado %v", broken, c.wantBroken)
			}
		})
	}
}
