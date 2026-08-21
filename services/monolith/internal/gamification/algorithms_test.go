package gamification

import (
	"math"
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

func TestCalcularXP_ComBonusDeCombo(t *testing.T) {
	// combo_maximo=3 na última pergunta -> bônus 3 (TDD §3.0.1, v1.4 — substitui o antigo bônus
	// de velocidade).
	r := CalcularXP("medium", 3, true, false, true, 0, false, false)
	if r.XPConcedido != 23 { // base 20 + bônus combo 3
		t.Errorf("XPConcedido = %d, esperado 23", r.XPConcedido)
	}
	if r.DailyCapReached {
		t.Error("DailyCapReached não deveria ser true")
	}
}

func TestCalcularXP_ComboSoAplicaNaUltimaPergunta(t *testing.T) {
	// Mesmo combo_maximo de 3, mas não é a última pergunta da sessão -> sem bônus ainda (o pico
	// só é premiado quando a sessão termina, mesmo que o combo atual já esteja alto).
	r := CalcularXP("medium", 3, false, false, true, 0, false, false)
	if r.XPConcedido != 20 { // só a base, sem bônus de combo
		t.Errorf("XPConcedido = %d, esperado 20 (sem bônus fora da última pergunta)", r.XPConcedido)
	}
}

func TestCalcularXP_ComboCapadoEmCinco(t *testing.T) {
	// combo_maximo=12 (sessão longa e perfeita) -> bônus capado em ComboBonusMax (5), não 12.
	r := CalcularXP("easy", 12, true, false, true, 0, false, false)
	if r.XPConcedido != 15 { // base 10 + bônus combo capado em 5
		t.Errorf("XPConcedido = %d, esperado 15 (bônus capado em 5)", r.XPConcedido)
	}
}

func TestCalcularXP_PrimeiraConclusao(t *testing.T) {
	r := CalcularXP("easy", 0, true, true, true, 0, false, false) // sem combo, isola o bônus de primeira conclusão
	if r.XPConcedido != 20 {                                      // base 10 + bônus primeira conclusão 10
		t.Errorf("XPConcedido = %d, esperado 20", r.XPConcedido)
	}
}

func TestCalcularXP_Errado(t *testing.T) {
	r := CalcularXP("hard", 5, true, true, false, 0, false, false)
	if r.XPConcedido != 0 {
		t.Errorf("XPConcedido = %d, esperado 0 (resposta errada nunca dá XP)", r.XPConcedido)
	}
}

func TestCalcularXP_TetoDiario(t *testing.T) {
	// 490 já ganhos hoje, resposta valeria 30 (hard, sem bônus) — só cabem 10.
	r := CalcularXP("hard", 0, false, false, true, 490, false, false)
	if r.XPConcedido != 10 {
		t.Errorf("XPConcedido = %d, esperado 10 (teto de 500)", r.XPConcedido)
	}
	if !r.DailyCapReached {
		t.Error("DailyCapReached deveria ser true")
	}
}

func TestCalcularXP_TetoJaEstourado(t *testing.T) {
	r := CalcularXP("easy", 0, false, false, true, 500, false, false)
	if r.XPConcedido != 0 {
		t.Errorf("XPConcedido = %d, esperado 0 (teto já no limite)", r.XPConcedido)
	}
	if !r.DailyCapReached {
		t.Error("DailyCapReached deveria ser true")
	}
}

func TestCalcularXP_VIPAplicaMultiplicadorAntesDoTeto(t *testing.T) {
	// medium sem bônus = 20 base; VIP: round(20 * 1.25) = 25.
	r := CalcularXP("medium", 0, false, false, true, 0, true, false)
	if r.XPConcedido != 25 {
		t.Errorf("XPConcedido = %d, esperado 25 (base 20 * 1.25)", r.XPConcedido)
	}
}

func TestCalcularXP_VIPTemTetoDiarioDobrado(t *testing.T) {
	// Mudou 19/08/2026, a pedido do usuário: VIP agora tem o teto diário DOBRADO (1000, não 500)
	// — antes o VIP só chegava no mesmo teto mais rápido, sem ganhar um teto maior; agora ganha.
	// 490 já ganhos hoje (menos da metade do teto VIP de 1000) — hard com bônus de combo máximo
	// (5) = 35 base, VIP eleva pra round(35*1.25)=44, cabe inteiro, sem capar.
	r := CalcularXP("hard", 5, true, false, true, 490, true, false)
	if r.XPConcedido != 44 {
		t.Errorf("XPConcedido = %d, esperado 44 (teto VIP de 1000 não capou)", r.XPConcedido)
	}
	if r.DailyCapReached {
		t.Error("DailyCapReached não deveria ser true — ainda longe do teto VIP de 1000")
	}
}

func TestCalcularXP_VIPCapaNoTetoDobrado(t *testing.T) {
	// 990 já ganhos hoje (perto do teto VIP de 1000, não do teto normal de 500) — só cabem 10.
	r := CalcularXP("hard", 5, true, false, true, 990, true, false)
	if r.XPConcedido != 10 {
		t.Errorf("XPConcedido = %d, esperado 10 (capado pelo teto VIP de 1000)", r.XPConcedido)
	}
	if !r.DailyCapReached {
		t.Error("DailyCapReached deveria ser true")
	}
}

func TestCalcularXP_NaoVIPUsaTetoNormal(t *testing.T) {
	// Mesmo cenário do teste VIP acima (490 já ganhos, 44 calculado), mas sem VIP — o teto
	// continua 500, então 490+44 ultrapassaria; só cabem 10.
	r := CalcularXP("hard", 5, true, false, true, 490, false, false)
	if r.XPConcedido != 10 {
		t.Errorf("XPConcedido = %d, esperado 10 (teto normal de 500, sem VIP)", r.XPConcedido)
	}
	if !r.DailyCapReached {
		t.Error("DailyCapReached deveria ser true")
	}
}

func TestCalcularXP_XPBoostSozinho(t *testing.T) {
	// medium sem bônus = 20 base; boost sozinho: round(20 * 2.0) = 40.
	r := CalcularXP("medium", 0, false, false, true, 0, false, true)
	if r.XPConcedido != 40 {
		t.Errorf("XPConcedido = %d, esperado 40 (base 20 * 2.0)", r.XPConcedido)
	}
}

func TestCalcularXP_XPBoostComVIPMultiplicadorCombinado(t *testing.T) {
	// easy(10) + bônus combo 3 (isLastQuestion) = 13 base. VIP*boost = 1.25*2.0 = 2.5.
	// Combinado (correto): round(13*2.5) = round(32.5) = 33. Se alguém reintroduzir arredondamento
	// sequencial (VIP primeiro, depois boost), o resultado vira round(round(13*1.25)*2) =
	// round(16*2) = 32 — este teste falha nesse caso, é guarda de regressão pro TDD §3.3.
	r := CalcularXP("easy", 3, true, false, true, 0, true, true)
	if r.XPConcedido != 33 {
		t.Errorf("XPConcedido = %d, esperado 33 (multiplicador combinado 2.5x, não arredondamento sequencial)", r.XPConcedido)
	}
}

func TestXPBoostAtivo(t *testing.T) {
	base := time.Date(2026, 8, 15, 12, 0, 0, 0, time.UTC)
	futuro := base.Add(10 * time.Minute)
	passado := base.Add(-10 * time.Minute)

	if XPBoostAtivo(nil, base) {
		t.Error("nil deveria significar sem boost ativo, nunca vitalício")
	}
	if !XPBoostAtivo(&futuro, base) {
		t.Error("prazo futuro deveria estar ativo")
	}
	if XPBoostAtivo(&passado, base) {
		t.Error("prazo passado não deveria estar ativo")
	}
}

func TestAtivarXPBoost(t *testing.T) {
	base := time.Date(2026, 8, 15, 12, 0, 0, 0, time.UTC)

	t.Run("sem boost ativo: conta a partir de agora", func(t *testing.T) {
		got := AtivarXPBoost(nil, base)
		esperado := base.Add(XPBoostDuration)
		if !got.Equal(esperado) {
			t.Errorf("AtivarXPBoost = %v, esperado %v", got, esperado)
		}
	})

	t.Run("boost expirado: conta a partir de agora, não da expiração antiga", func(t *testing.T) {
		expirado := base.Add(-10 * time.Minute)
		got := AtivarXPBoost(&expirado, base)
		esperado := base.Add(XPBoostDuration)
		if !got.Equal(esperado) {
			t.Errorf("AtivarXPBoost = %v, esperado %v", got, esperado)
		}
	})

	t.Run("boost ainda ativo: empilha a partir do fim do boost atual", func(t *testing.T) {
		ativoAte := base.Add(5 * time.Minute)
		got := AtivarXPBoost(&ativoAte, base)
		esperado := ativoAte.Add(XPBoostDuration)
		if !got.Equal(esperado) {
			t.Errorf("AtivarXPBoost = %v, esperado %v (empilhado, não a partir de agora)", got, esperado)
		}
	})
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

func TestProbabilidadeAcerto(t *testing.T) {
	casos := []struct {
		nome       string
		skill      float64
		difficulty string
		want       float64
	}{
		{"skill=0 contra easy (b=-1.5): P alta", 0, "easy", 1 / (1 + math.Exp(-1.5))},
		{"skill=0 contra medium (b=-0.5): P>0.5", 0, "medium", 1 / (1 + math.Exp(-0.5))},
		{"skill=0 contra hard (b=0.5): P<0.5", 0, "hard", 1 / (1 + math.Exp(0.5))},
		{"skill=0 contra impossible (b=1.5): P baixa", 0, "impossible", 1 / (1 + math.Exp(1.5))},
		{"skill exatamente na dificuldade do item: P=0.5", 0.5, "hard", 0.5},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			got := ProbabilidadeAcerto(c.skill, c.difficulty)
			if math.Abs(got-c.want) > 1e-9 {
				t.Errorf("ProbabilidadeAcerto(%v, %q) = %v, esperado %v", c.skill, c.difficulty, got, c.want)
			}
		})
	}
}

func TestAtualizarHabilidade_DirecaoDoAjuste(t *testing.T) {
	t.Run("acerto em item mais difícil que a habilidade atual: sobe", func(t *testing.T) {
		got := AtualizarHabilidade(0, 20, "hard", true)
		if got <= 0 {
			t.Errorf("AtualizarHabilidade = %v, esperado subir acima de 0 após acerto", got)
		}
	})
	t.Run("erro em item mais fácil que a habilidade atual: desce", func(t *testing.T) {
		got := AtualizarHabilidade(0, 20, "easy", false)
		if got >= 0 {
			t.Errorf("AtualizarHabilidade = %v, esperado cair abaixo de 0 após erro", got)
		}
	})
	t.Run("acerto exatamente no ponto de 50% (skill == dificuldade do item): ajuste = K/2", func(t *testing.T) {
		got := AtualizarHabilidade(0.5, 20, "hard", true)
		esperado := 0.5 + SkillKEstablished*0.5
		if math.Abs(got-esperado) > 1e-9 {
			t.Errorf("AtualizarHabilidade = %v, esperado %v", got, esperado)
		}
	})
}

func TestAtualizarHabilidade_FronteiraDoKProvisorio(t *testing.T) {
	// respostasNoTopico é a contagem ANTES desta resposta: 9 ainda usa K provisório, 10 já usa
	// K estabelecido.
	t.Run("respostasNoTopico=9 usa K provisório", func(t *testing.T) {
		got := AtualizarHabilidade(0, 9, "medium", true)
		p := ProbabilidadeAcerto(0, "medium")
		esperado := 0 + SkillKProvisional*(1-p)
		if math.Abs(got-esperado) > 1e-9 {
			t.Errorf("AtualizarHabilidade = %v, esperado %v (K provisório)", got, esperado)
		}
	})
	t.Run("respostasNoTopico=10 já usa K estabelecido", func(t *testing.T) {
		got := AtualizarHabilidade(0, 10, "medium", true)
		p := ProbabilidadeAcerto(0, "medium")
		esperado := 0 + SkillKEstablished*(1-p)
		if math.Abs(got-esperado) > 1e-9 {
			t.Errorf("AtualizarHabilidade = %v, esperado %v (K estabelecido)", got, esperado)
		}
	})
}

func TestAtualizarHabilidade_NuncaUltrapassaOsLimites(t *testing.T) {
	t.Run("acertos repetidos em item fácil não ultrapassam SkillMax", func(t *testing.T) {
		skill := 0.0
		for i := 0; i < 10000; i++ {
			skill = AtualizarHabilidade(skill, 100, "easy", true)
		}
		if skill > SkillMax {
			t.Errorf("skill = %v, nunca deveria ultrapassar SkillMax (%v)", skill, SkillMax)
		}
	})
	t.Run("erros repetidos em item difícil não ultrapassam SkillMin", func(t *testing.T) {
		skill := 0.0
		for i := 0; i < 10000; i++ {
			skill = AtualizarHabilidade(skill, 100, "impossible", false)
		}
		if skill < SkillMin {
			t.Errorf("skill = %v, nunca deveria ultrapassar SkillMin (%v)", skill, SkillMin)
		}
	})
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
	novo, novoUpdatedAt := RegenerarVidas(HeartsMax, base, base.Add(100*time.Hour), false)
	if novo != HeartsMax {
		t.Errorf("novo = %d, esperado permanecer no teto %d", novo, HeartsMax)
	}
	if !novoUpdatedAt.Equal(base) {
		t.Errorf("updatedAt não deveria mudar quando já está no teto")
	}
}

func TestRegenerarVidas_AindaNaoPassouUmTique(t *testing.T) {
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	novo, novoUpdatedAt := RegenerarVidas(2, base, base.Add(35*time.Minute), false)
	if novo != 2 {
		t.Errorf("novo = %d, esperado permanecer 2 (intervalo de 36min não completou)", novo)
	}
	if !novoUpdatedAt.Equal(base) {
		t.Errorf("updatedAt não deveria mudar antes de completar um tique")
	}
}

func TestRegenerarVidas_UmTiqueCompleto(t *testing.T) {
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	novo, novoUpdatedAt := RegenerarVidas(2, base, base.Add(36*time.Minute), false)
	if novo != 3 {
		t.Errorf("novo = %d, esperado 3", novo)
	}
	esperado := base.Add(36 * time.Minute)
	if !novoUpdatedAt.Equal(esperado) {
		t.Errorf("updatedAt = %v, esperado %v", novoUpdatedAt, esperado)
	}
}

func TestRegenerarVidas_PreservaProgressoParcial(t *testing.T) {
	// 50min depois, com 1 intervalo de 36min: ganha 1 vida e o relógio avança só 36min, não pra
	// "agora" — sobram 14min de progresso pro próximo tique (TDD §5.4).
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	agora := base.Add(50 * time.Minute)
	novo, novoUpdatedAt := RegenerarVidas(3, base, agora, false)
	if novo != 4 {
		t.Errorf("novo = %d, esperado 4", novo)
	}
	esperado := base.Add(36 * time.Minute)
	if !novoUpdatedAt.Equal(esperado) {
		t.Errorf("updatedAt = %v, esperado %v (progresso parcial preservado)", novoUpdatedAt, esperado)
	}
	if restante := agora.Sub(novoUpdatedAt); restante != 14*time.Minute {
		t.Errorf("progresso restante = %v, esperado 14min", restante)
	}
}

func TestRegenerarVidas_MultiplosTiquesCapadoNoTeto(t *testing.T) {
	// Longe por 20h com hearts_current=3: 33 tiques de 36min regenerariam bem mais que 5 vidas,
	// mas o teto é 5.
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	agora := base.Add(20 * time.Hour)
	novo, novoUpdatedAt := RegenerarVidas(3, base, agora, false)
	if novo != HeartsMax {
		t.Errorf("novo = %d, esperado capar no teto %d", novo, HeartsMax)
	}
	if !novoUpdatedAt.Equal(agora) {
		t.Errorf("updatedAt = %v, esperado igual a agora (%v) quando capa no teto", novoUpdatedAt, agora)
	}
}

func TestProximaVidaEm_NoTeto(t *testing.T) {
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	if got := ProximaVidaEm(HeartsMax, base, false); got != nil {
		t.Errorf("esperado nil no teto, veio %v", got)
	}
}

func TestProximaVidaEm_AbaixoDoTeto(t *testing.T) {
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	got := ProximaVidaEm(3, base, false)
	if got == nil {
		t.Fatal("esperado um timestamp, veio nil")
	}
	esperado := base.Add(HeartsRegenInterval)
	if !got.Equal(esperado) {
		t.Errorf("ProximaVidaEm = %v, esperado %v", got, esperado)
	}
}

func TestRegenerarVidas_VIPRegeneraMaisRapido(t *testing.T) {
	// VIPHeartsRegenFactor = 0.3: 36min vira ~10min48s. A pedido do usuário, 19/08/2026.
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	intervaloVIP := time.Duration(float64(HeartsRegenInterval) * VIPHeartsRegenFactor)

	// Um pouco antes do intervalo VIP: ainda não regenerou.
	novo, novoUpdatedAt := RegenerarVidas(2, base, base.Add(intervaloVIP-time.Minute), true)
	if novo != 2 {
		t.Errorf("novo = %d, esperado permanecer 2 (intervalo VIP ainda não completou)", novo)
	}
	if !novoUpdatedAt.Equal(base) {
		t.Errorf("updatedAt não deveria mudar antes de completar um tique VIP")
	}

	// Exatamente no intervalo VIP: regenerou, mas NÃO teria regenerado ainda com o intervalo normal.
	novo2, novoUpdatedAt2 := RegenerarVidas(2, base, base.Add(intervaloVIP), true)
	if novo2 != 3 {
		t.Errorf("novo = %d, esperado 3 (1 tique VIP completo)", novo2)
	}
	esperado := base.Add(intervaloVIP)
	if !novoUpdatedAt2.Equal(esperado) {
		t.Errorf("updatedAt = %v, esperado %v", novoUpdatedAt2, esperado)
	}
	if intervaloVIP >= HeartsRegenInterval {
		t.Fatal("sanity check: intervalo VIP deveria ser bem menor que o normal")
	}
}

func TestProximaVidaEm_VIPUsaIntervaloMenor(t *testing.T) {
	base := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	got := ProximaVidaEm(3, base, true)
	if got == nil {
		t.Fatal("esperado um timestamp, veio nil")
	}
	esperado := base.Add(time.Duration(float64(HeartsRegenInterval) * VIPHeartsRegenFactor))
	if !got.Equal(esperado) {
		t.Errorf("ProximaVidaEm (VIP) = %v, esperado %v", got, esperado)
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

func TestCapDeFreezes(t *testing.T) {
	casos := []struct {
		nome       string
		streakBest int
		want       int
	}{
		{"streak_best zero, teto padrão", 0, StreakFreezeCapPadrao},
		{"logo abaixo do marco, ainda teto padrão", 99, StreakFreezeCapPadrao},
		{"exatamente no marco, já teto ampliado", 100, StreakFreezeCapMarco},
		{"acima do marco, teto ampliado", 101, StreakFreezeCapMarco},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			if got := CapDeFreezes(c.streakBest); got != c.want {
				t.Errorf("CapDeFreezes(%d) = %d, esperado %d", c.streakBest, got, c.want)
			}
		})
	}
}

func TestPrepararReparoStreak(t *testing.T) {
	repairValue, repairDeadline := PrepararReparoStreak(7, "2026-08-15")
	if repairValue != 7 {
		t.Errorf("repairValue = %d, esperado 7 (valor perdido repassado sem alteração)", repairValue)
	}
	if repairDeadline != "2026-08-18" {
		t.Errorf("repairDeadline = %q, esperado 2026-08-18 (hoje + %d dias)", repairDeadline, StreakRepairJanelaDias)
	}
}

func TestAplicarReparoStreak(t *testing.T) {
	prev := StreakState{Current: 0, Best: 10, LastActiveDate: "2026-08-12"}

	casos := []struct {
		nome           string
		repairValue    int
		repairDeadline string
		hojeLocal      string
		wantReparado   bool
	}{
		{"dentro do prazo, dia 0 (mesmo dia da expiração)", 7, "2026-08-18", "2026-08-15", true},
		{"dentro do prazo, último dia (dia 3)", 7, "2026-08-18", "2026-08-18", true},
		{"fora do prazo (dia 4)", 7, "2026-08-18", "2026-08-19", false},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			got, reparado := AplicarReparoStreak(prev, c.repairValue, c.repairDeadline, c.hojeLocal)
			if reparado != c.wantReparado {
				t.Errorf("reparado = %v, esperado %v", reparado, c.wantReparado)
			}
			if !reparado {
				if got != prev {
					t.Errorf("streak vencida deveria devolver prev inalterado, veio %+v", got)
				}
				return
			}
			if got.Current != c.repairValue+1 {
				t.Errorf("Current = %d, esperado %d (repairValue+1)", got.Current, c.repairValue+1)
			}
			if got.LastActiveDate != c.hojeLocal {
				t.Errorf("LastActiveDate = %q, esperado %q", got.LastActiveDate, c.hojeLocal)
			}
		})
	}

	t.Run("Best sobe quando o valor reparado supera o recorde anterior", func(t *testing.T) {
		prevBaixo := StreakState{Current: 0, Best: 3, LastActiveDate: "2026-08-12"}
		got, reparado := AplicarReparoStreak(prevBaixo, 7, "2026-08-18", "2026-08-15")
		if !reparado {
			t.Fatal("esperado reparo bem-sucedido")
		}
		if got.Best != 8 {
			t.Errorf("Best = %d, esperado 8 (novo recorde: repairValue+1)", got.Best)
		}
	})

	t.Run("Best preservado quando o valor reparado não supera o recorde anterior", func(t *testing.T) {
		got, reparado := AplicarReparoStreak(prev, 7, "2026-08-18", "2026-08-15")
		if !reparado {
			t.Fatal("esperado reparo bem-sucedido")
		}
		if got.Best != prev.Best {
			t.Errorf("Best = %d, esperado permanecer %d", got.Best, prev.Best)
		}
	})

	t.Run("data de prazo malformada não gera panic, devolve reparado=false", func(t *testing.T) {
		got, reparado := AplicarReparoStreak(prev, 7, "not-a-date", "2026-08-15")
		if reparado {
			t.Error("esperado reparado=false com prazo malformado")
		}
		if got != prev {
			t.Errorf("esperado prev inalterado com prazo malformado, veio %+v", got)
		}
	})
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
		{"acima do corte, detalhe baixo (1º terço) -> bloqueio de ofensiva", 0.9, 0.0, ChestRewardStreakFreeze, 0},
		{"acima do corte, detalhe no meio (2º terço) -> recarga de vidas", 0.9, 0.5, ChestRewardHeartsRefill, 0},
		{"acima do corte, detalhe alto (3º terço) -> XP boost", 0.9, 0.999, ChestRewardXPBoost, 0},
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

func TestQuestoesSemanaAposReset(t *testing.T) {
	if got, ciclo := QuestoesSemanaAposReset(30, "", "2026-08-15"); got != 0 || ciclo != "2026-08-15" {
		t.Errorf("sem ciclo ativo deveria iniciar ciclo hoje com contador 0, veio (%d, %q)", got, ciclo)
	}
	if got, ciclo := QuestoesSemanaAposReset(30, "2026-08-15", "2026-08-15"); got != 30 || ciclo != "2026-08-15" {
		t.Errorf("mesmo dia do início do ciclo deveria manter contador e ciclo, veio (%d, %q)", got, ciclo)
	}
	if got, ciclo := QuestoesSemanaAposReset(30, "2026-08-15", "2026-08-21"); got != 30 || ciclo != "2026-08-15" {
		t.Errorf("6 dias depois (dentro da janela de 7) deveria manter, veio (%d, %q)", got, ciclo)
	}
	if got, ciclo := QuestoesSemanaAposReset(30, "2026-08-15", "2026-08-22"); got != 0 || ciclo != "2026-08-22" {
		t.Errorf("exatamente 7 dias depois deveria resetar e iniciar novo ciclo hoje, veio (%d, %q)", got, ciclo)
	}
	if got, ciclo := QuestoesSemanaAposReset(30, "2026-08-15", "2026-09-01"); got != 0 || ciclo != "2026-09-01" {
		t.Errorf("muito depois do fim do ciclo deveria resetar, veio (%d, %q)", got, ciclo)
	}
}

func TestRolarRecompensaBauSemanal(t *testing.T) {
	casos := []struct {
		nome           string
		rollType       float64
		rollDetail     float64
		wantType       ChestRewardType
		wantGemsAmount int
	}{
		{"abaixo do corte de gemas, detalhe 0 -> 5 gemas (mínimo)", 0.0, 0.0, ChestRewardGems, 5},
		{"abaixo do corte de gemas, detalhe alto -> 15 gemas (teto)", 0.5, 0.999, ChestRewardGems, 15},
		{"exatamente no corte de gemas (0.60) já cai pro pool de item", 0.60, 0.0, ChestRewardStreakFreeze, 0},
		{"acima do corte, detalhe baixo (1º terço) -> bloqueio de ofensiva", 0.9, 0.0, ChestRewardStreakFreeze, 0},
		{"acima do corte, detalhe no meio (2º terço) -> recarga de vidas", 0.9, 0.5, ChestRewardHeartsRefill, 0},
		{"acima do corte, detalhe alto (3º terço) -> XP boost", 0.9, 0.999, ChestRewardXPBoost, 0},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			got := RolarRecompensaBauSemanal(c.rollType, c.rollDetail)
			if got.Type != c.wantType {
				t.Errorf("RolarRecompensaBauSemanal(%v, %v).Type = %q, esperado %q", c.rollType, c.rollDetail, got.Type, c.wantType)
			}
			if got.Type == ChestRewardGems && got.GemsAmount != c.wantGemsAmount {
				t.Errorf("RolarRecompensaBauSemanal(%v, %v).GemsAmount = %d, esperado %d", c.rollType, c.rollDetail, got.GemsAmount, c.wantGemsAmount)
			}
		})
	}

	t.Run("gemas sempre entre 5 e 15 pra qualquer rollDetail no pool de gemas", func(t *testing.T) {
		for i := 0; i < 100; i++ {
			rollDetail := float64(i) / 100
			got := RolarRecompensaBauSemanal(0.1, rollDetail)
			if got.GemsAmount < 5 || got.GemsAmount > 15 {
				t.Errorf("RolarRecompensaBauSemanal(0.1, %v).GemsAmount = %d, esperado entre 5 e 15", rollDetail, got.GemsAmount)
			}
		}
	})
}

func TestEhVIPAtivo(t *testing.T) {
	base := time.Date(2026, 8, 15, 12, 0, 0, 0, time.UTC)
	futuro := base.Add(24 * time.Hour)
	passado := base.Add(-24 * time.Hour)

	if EhVIPAtivo(false, nil, base) {
		t.Error("is_vip=false nunca deveria estar ativo")
	}
	if EhVIPAtivo(false, &futuro, base) {
		t.Error("is_vip=false nunca deveria estar ativo, mesmo com expiração futura")
	}
	if !EhVIPAtivo(true, nil, base) {
		t.Error("is_vip=true sem vip_expires_at deveria ser VIP vitalício")
	}
	if !EhVIPAtivo(true, &futuro, base) {
		t.Error("is_vip=true com expiração futura deveria estar ativo")
	}
	if EhVIPAtivo(true, &passado, base) {
		t.Error("is_vip=true com expiração passada não deveria estar ativo")
	}
}

func TestEstenderVIP(t *testing.T) {
	base := time.Date(2026, 8, 15, 12, 0, 0, 0, time.UTC)

	t.Run("sem VIP ativo: conta a partir de agora", func(t *testing.T) {
		got := EstenderVIP(false, nil, base, 30)
		esperado := base.AddDate(0, 0, 30)
		if got == nil || !got.Equal(esperado) {
			t.Errorf("EstenderVIP = %v, esperado %v", got, esperado)
		}
	})

	t.Run("VIP expirado: conta a partir de agora, não da expiração antiga", func(t *testing.T) {
		expirado := base.Add(-24 * time.Hour)
		got := EstenderVIP(true, &expirado, base, 10)
		esperado := base.AddDate(0, 0, 10)
		if got == nil || !got.Equal(esperado) {
			t.Errorf("EstenderVIP = %v, esperado %v", got, esperado)
		}
	})

	t.Run("VIP ativo com prazo: empilha a partir da expiração atual", func(t *testing.T) {
		expiraEm := base.AddDate(0, 0, 5)
		got := EstenderVIP(true, &expiraEm, base, 10)
		esperado := expiraEm.AddDate(0, 0, 10)
		if got == nil || !got.Equal(esperado) {
			t.Errorf("EstenderVIP = %v, esperado %v (15 dias a partir de agora)", got, esperado)
		}
	})

	t.Run("VIP vitalício permanece vitalício", func(t *testing.T) {
		got := EstenderVIP(true, nil, base, 30)
		if got != nil {
			t.Errorf("EstenderVIP = %v, esperado nil (vitalício)", got)
		}
	})
}

func TestVIPResetsAposReset(t *testing.T) {
	if got := VIPResetsAposReset(1, "2026-08-14", "2026-08-15"); got != 0 {
		t.Errorf("esperado reset para 0 em período novo, veio %d", got)
	}
	if got := VIPResetsAposReset(1, "2026-08-15", "2026-08-15"); got != 1 {
		t.Errorf("esperado manter 1 no mesmo período, veio %d", got)
	}
	if got := VIPResetsAposReset(1, "", "2026-08-15"); got != 0 {
		t.Errorf("período salvo vazio deveria resetar pra 0, veio %d", got)
	}
}
