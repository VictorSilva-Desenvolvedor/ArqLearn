package gamification

import "testing"

// TestNivel_TabelaDoTDD confere Nivel() contra a tabela exata do TDD §3.1.
func TestNivel_TabelaDoTDD(t *testing.T) {
	casos := []struct {
		xpTotal int
		nivel   int
	}{
		{0, 1},
		{99, 1},
		{100, 2},
		{399, 2},
		{400, 3},
		{899, 3},
		{900, 4},
		{1599, 4},
		{1600, 5},
		{2499, 5},
		{2500, 6},
		{3599, 6},
		{3600, 7},
		{4899, 7},
		{4900, 8},
	}
	for _, c := range casos {
		if got := Nivel(c.xpTotal); got != c.nivel {
			t.Errorf("Nivel(%d) = %d, esperado %d", c.xpTotal, got, c.nivel)
		}
	}
}

func TestCalcularXP_CorretoDentroDoLimiar(t *testing.T) {
	r := CalcularXP("medium", 3000, false, true, 0)
	if r.XPConcedido != 25 { // base 20 + bônus velocidade 5
		t.Errorf("XPConcedido = %d, esperado 25", r.XPConcedido)
	}
	if r.DailyCapReached {
		t.Error("DailyCapReached não deveria ser true")
	}
}

func TestCalcularXP_PrimeiraConclusao(t *testing.T) {
	r := CalcularXP("easy", 10000, true, true, 0) // fora do limiar de velocidade (5000ms)
	if r.XPConcedido != 20 {                      // base 10 + bônus primeira conclusão 10
		t.Errorf("XPConcedido = %d, esperado 20", r.XPConcedido)
	}
}

func TestCalcularXP_Errado(t *testing.T) {
	r := CalcularXP("hard", 1000, true, false, 0)
	if r.XPConcedido != 0 {
		t.Errorf("XPConcedido = %d, esperado 0 (resposta errada nunca dá XP)", r.XPConcedido)
	}
}

func TestCalcularXP_TetoDiario(t *testing.T) {
	// 490 já ganhos hoje, resposta valeria 30 (hard, sem bônus) — só cabem 10.
	r := CalcularXP("hard", 99999, false, true, 490)
	if r.XPConcedido != 10 {
		t.Errorf("XPConcedido = %d, esperado 10 (teto de 500)", r.XPConcedido)
	}
	if !r.DailyCapReached {
		t.Error("DailyCapReached deveria ser true")
	}
}

func TestCalcularXP_TetoJaEstourado(t *testing.T) {
	r := CalcularXP("easy", 100, false, true, 500)
	if r.XPConcedido != 0 {
		t.Errorf("XPConcedido = %d, esperado 0 (teto já no limite)", r.XPConcedido)
	}
	if !r.DailyCapReached {
		t.Error("DailyCapReached deveria ser true")
	}
}

func TestXPHojeAposReset(t *testing.T) {
	if got := XPHojeAposReset(300, "2026-08-07", "2026-08-08"); got != 0 {
		t.Errorf("esperado reset para 0 em dia novo, veio %d", got)
	}
	if got := XPHojeAposReset(300, "2026-08-08", "2026-08-08"); got != 300 {
		t.Errorf("esperado manter 300 no mesmo dia, veio %d", got)
	}
}

func TestAtualizarSRS_PrimeiroAcertoRapido(t *testing.T) {
	prev := SRSState{EaseFactor: DefaultEaseFactor, IntervalDays: 0}
	next := AtualizarSRS(prev, "medium", 2000, true) // dentro do limiar (8000ms) => q=5
	if next.IntervalDays != 1 {
		t.Errorf("IntervalDays = %d, esperado 1 (primeiro acerto)", next.IntervalDays)
	}
	if next.EaseFactor <= prev.EaseFactor {
		t.Errorf("EaseFactor deveria subir com q=5, veio %.2f (prev %.2f)", next.EaseFactor, prev.EaseFactor)
	}
}

func TestAtualizarSRS_SegundoAcerto(t *testing.T) {
	prev := SRSState{EaseFactor: 2.6, IntervalDays: 1}
	next := AtualizarSRS(prev, "medium", 2000, true)
	if next.IntervalDays != 6 {
		t.Errorf("IntervalDays = %d, esperado 6 (segundo acerto)", next.IntervalDays)
	}
}

func TestAtualizarSRS_Erro(t *testing.T) {
	prev := SRSState{EaseFactor: 2.6, IntervalDays: 10}
	next := AtualizarSRS(prev, "medium", 3000, false)
	if next.IntervalDays != 1 {
		t.Errorf("IntervalDays = %d, esperado 1 (reset após erro)", next.IntervalDays)
	}
	if next.EaseFactor >= prev.EaseFactor {
		t.Errorf("EaseFactor deveria cair após erro, veio %.2f (prev %.2f)", next.EaseFactor, prev.EaseFactor)
	}
}

func TestAtualizarSRS_EaseFactorNuncaAbaixoDoPiso(t *testing.T) {
	prev := SRSState{EaseFactor: 1.35, IntervalDays: 5}
	next := AtualizarSRS(prev, "hard", 99999, false)
	if next.EaseFactor != 1.3 {
		t.Errorf("EaseFactor = %.2f, esperado piso de 1.3", next.EaseFactor)
	}
}

func TestAtualizarStreak_DiaNovo(t *testing.T) {
	prev := StreakState{Current: 5, Best: 10, LastActiveDate: "2026-08-07"}
	next := AtualizarStreak(prev, "2026-08-08")
	if next.Current != 6 {
		t.Errorf("Current = %d, esperado 6", next.Current)
	}
	if next.Best != 10 {
		t.Errorf("Best = %d, esperado permanecer 10", next.Best)
	}
}

func TestAtualizarStreak_MesmoDiaNaoIncrementaDeNovo(t *testing.T) {
	prev := StreakState{Current: 5, Best: 10, LastActiveDate: "2026-08-08"}
	next := AtualizarStreak(prev, "2026-08-08")
	if next.Current != 5 {
		t.Errorf("Current = %d, esperado permanecer 5 (mesmo dia)", next.Current)
	}
}

func TestAtualizarStreak_NovoRecorde(t *testing.T) {
	prev := StreakState{Current: 10, Best: 10, LastActiveDate: "2026-08-07"}
	next := AtualizarStreak(prev, "2026-08-08")
	if next.Best != 11 {
		t.Errorf("Best = %d, esperado 11 (novo recorde)", next.Best)
	}
}
