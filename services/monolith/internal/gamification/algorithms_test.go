package gamification

import (
	"testing"
	"time"
)

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

func TestRegenerarVidas_JaNoTeto(t *testing.T) {
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	novo, novoUpdatedAt := RegenerarVidas(HeartsMax, base, base.Add(100*time.Hour))
	if novo != HeartsMax {
		t.Errorf("novo = %d, esperado permanecer no teto %d", novo, HeartsMax)
	}
	if !novoUpdatedAt.Equal(base) {
		t.Errorf("updatedAt não deveria mudar quando já está no teto")
	}
}

func TestRegenerarVidas_AindaNaoPassouUmTique(t *testing.T) {
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	novo, novoUpdatedAt := RegenerarVidas(2, base, base.Add(2*time.Hour+59*time.Minute))
	if novo != 2 {
		t.Errorf("novo = %d, esperado permanecer 2 (intervalo de 3h não completou)", novo)
	}
	if !novoUpdatedAt.Equal(base) {
		t.Errorf("updatedAt não deveria mudar antes de completar um tique")
	}
}

func TestRegenerarVidas_UmTiqueCompleto(t *testing.T) {
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	novo, novoUpdatedAt := RegenerarVidas(2, base, base.Add(3*time.Hour))
	if novo != 3 {
		t.Errorf("novo = %d, esperado 3", novo)
	}
	esperado := base.Add(3 * time.Hour)
	if !novoUpdatedAt.Equal(esperado) {
		t.Errorf("updatedAt = %v, esperado %v", novoUpdatedAt, esperado)
	}
}

func TestRegenerarVidas_PreservaProgressoParcial(t *testing.T) {
	// 4h20 depois, com 1 intervalo de 3h: ganha 1 vida e o relógio avança só 3h, não pra "agora"
	// — sobram 1h20 de progresso pro próximo tique (TDD §5.4).
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	agora := base.Add(4*time.Hour + 20*time.Minute)
	novo, novoUpdatedAt := RegenerarVidas(3, base, agora)
	if novo != 4 {
		t.Errorf("novo = %d, esperado 4", novo)
	}
	esperado := base.Add(3 * time.Hour)
	if !novoUpdatedAt.Equal(esperado) {
		t.Errorf("updatedAt = %v, esperado %v (progresso parcial preservado)", novoUpdatedAt, esperado)
	}
	if restante := agora.Sub(novoUpdatedAt); restante != 1*time.Hour+20*time.Minute {
		t.Errorf("progresso restante = %v, esperado 1h20", restante)
	}
}

func TestRegenerarVidas_MultiplosTiquesCapadoNoTeto(t *testing.T) {
	// Longe por 20h com hearts_current=3: 6 tiques de 3h regenerariam 9 vidas, mas o teto é 5.
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	agora := base.Add(20 * time.Hour)
	novo, novoUpdatedAt := RegenerarVidas(3, base, agora)
	if novo != HeartsMax {
		t.Errorf("novo = %d, esperado capar no teto %d", novo, HeartsMax)
	}
	if !novoUpdatedAt.Equal(agora) {
		t.Errorf("updatedAt = %v, esperado igual a agora (%v) quando capa no teto", novoUpdatedAt, agora)
	}
}

func TestProximaVidaEm_NoTeto(t *testing.T) {
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	if got := ProximaVidaEm(HeartsMax, base); got != nil {
		t.Errorf("esperado nil no teto, veio %v", got)
	}
}

func TestProximaVidaEm_AbaixoDoTeto(t *testing.T) {
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	got := ProximaVidaEm(3, base)
	if got == nil {
		t.Fatal("esperado um timestamp, veio nil")
	}
	esperado := base.Add(HeartsRegenInterval)
	if !got.Equal(esperado) {
		t.Errorf("ProximaVidaEm = %v, esperado %v", got, esperado)
	}
}

func TestAplicarExpiracaoStreak(t *testing.T) {
	casos := []struct {
		nome             string
		streakCurrent    int
		lastActiveDate   string
		freezesAvailable int
		hojeLocal        string
		wantStreak       int
		wantLastActive   string
		wantFreezes      int
		wantExpirou      bool
	}{
		{"sem streak, nada a fazer", 0, "", 0, "2026-08-15", 0, "", 0, false},
		{"praticou hoje, intacta", 5, "2026-08-15", 0, "2026-08-15", 5, "2026-08-15", 0, false},
		{"praticou ontem, intacta (ainda não praticou hoje)", 5, "2026-08-14", 0, "2026-08-15", 5, "2026-08-14", 0, false},
		{"pulou 2 dias, com freeze, consome e preserva streak, avança pra ontem (não hoje)", 5, "2026-08-12", 2, "2026-08-15", 5, "2026-08-14", 1, false},
		{"pulou 2 dias, sem freeze, zera", 5, "2026-08-12", 0, "2026-08-15", 0, "2026-08-12", 0, true},
		{"pulou 1 dia inteiro (anteontem), sem freeze, zera", 5, "2026-08-13", 0, "2026-08-15", 0, "2026-08-13", 0, true},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			gotStreak, gotLastActive, gotFreezes, gotExpirou := AplicarExpiracaoStreak(c.streakCurrent, c.lastActiveDate, c.freezesAvailable, c.hojeLocal)
			if gotStreak != c.wantStreak || gotLastActive != c.wantLastActive || gotFreezes != c.wantFreezes || gotExpirou != c.wantExpirou {
				t.Errorf("AplicarExpiracaoStreak(%d, %q, %d, %q) = (%d, %q, %d, %v), esperado (%d, %q, %d, %v)",
					c.streakCurrent, c.lastActiveDate, c.freezesAvailable, c.hojeLocal,
					gotStreak, gotLastActive, gotFreezes, gotExpirou, c.wantStreak, c.wantLastActive, c.wantFreezes, c.wantExpirou)
			}
		})
	}

	t.Run("idempotente no mesmo dia: reaplicar após consumir um freeze não consome outro", func(t *testing.T) {
		streak, lastActive, freezes, _ := AplicarExpiracaoStreak(5, "2026-08-12", 2, "2026-08-15")
		streak2, lastActive2, freezes2, _ := AplicarExpiracaoStreak(streak, lastActive, freezes, "2026-08-15")
		if streak2 != 5 || freezes2 != 1 || lastActive2 != "2026-08-14" {
			t.Errorf("segunda avaliação no mesmo dia consumiu freeze de novo: streak=%d freezes=%d lastActive=%q", streak2, freezes2, lastActive2)
		}
	})
}

func TestStreakEmRisco(t *testing.T) {
	if StreakEmRisco(0, "2026-08-14", "2026-08-15") {
		t.Error("sem streak não deveria estar em risco")
	}
	if !StreakEmRisco(3, "2026-08-14", "2026-08-15") {
		t.Error("streak positiva sem prática hoje deveria estar em risco")
	}
	if StreakEmRisco(3, "2026-08-15", "2026-08-15") {
		t.Error("já praticou hoje, não deveria estar em risco")
	}
}

func TestQuestoesHojeAposReset(t *testing.T) {
	if got := QuestoesHojeAposReset(7, "2026-08-14", "2026-08-15"); got != 0 {
		t.Errorf("esperado reset para 0 em dia novo, veio %d", got)
	}
	if got := QuestoesHojeAposReset(7, "2026-08-15", "2026-08-15"); got != 7 {
		t.Errorf("esperado manter 7 no mesmo dia, veio %d", got)
	}
	if got := QuestoesHojeAposReset(7, "", "2026-08-15"); got != 0 {
		t.Errorf("data vazia (nunca respondeu) deveria resetar pra 0, veio %d", got)
	}
}

func TestRolarRecompensaBau(t *testing.T) {
	casos := []struct {
		nome           string
		rollType       float64
		rollDetail     float64
		wantType       ChestRewardType
		wantGemsAmount int
	}{
		{"abaixo do corte de gemas, detalhe 0 -> 1 gema (mínimo)", 0.0, 0.0, ChestRewardGems, 1},
		{"abaixo do corte de gemas, detalhe alto -> 5 gemas (teto)", 0.5, 0.999, ChestRewardGems, 5},
		{"exatamente no corte de gemas (0.75) já cai pro pool de item", 0.75, 0.0, ChestRewardStreakFreeze, 0},
		{"acima do corte, detalhe baixo -> bloqueio de ofensiva", 0.9, 0.0, ChestRewardStreakFreeze, 0},
		{"acima do corte, detalhe alto -> recarga de vidas", 0.9, 0.999, ChestRewardHeartsRefill, 0},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			got := RolarRecompensaBau(c.rollType, c.rollDetail)
			if got.Type != c.wantType {
				t.Errorf("RolarRecompensaBau(%v, %v).Type = %q, esperado %q", c.rollType, c.rollDetail, got.Type, c.wantType)
			}
			if got.Type == ChestRewardGems && got.GemsAmount != c.wantGemsAmount {
				t.Errorf("RolarRecompensaBau(%v, %v).GemsAmount = %d, esperado %d", c.rollType, c.rollDetail, got.GemsAmount, c.wantGemsAmount)
			}
		})
	}

	t.Run("gemas sempre entre 1 e 5 pra qualquer rollDetail no pool de gemas", func(t *testing.T) {
		for i := 0; i < 100; i++ {
			rollDetail := float64(i) / 100
			got := RolarRecompensaBau(0.1, rollDetail)
			if got.GemsAmount < 1 || got.GemsAmount > 5 {
				t.Errorf("RolarRecompensaBau(0.1, %v).GemsAmount = %d, esperado entre 1 e 5", rollDetail, got.GemsAmount)
			}
		}
	})
}
