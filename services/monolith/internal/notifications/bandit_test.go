package notifications

import (
	"math"
	"testing"
)

func uniformSlice(n int, v float64) []float64 {
	s := make([]float64, n)
	for i := range s {
		s[i] = v
	}
	return s
}

func TestAmostraBeta_SimetricoNoPontoMedio(t *testing.T) {
	// Beta(1,1) com o único uniform de cada lado igual a 0.5: os dois expoenciais valem o mesmo
	// -ln(0.5), então X/(X+Y) = 0.5 exatamente, qualquer que seja o valor comum.
	got := amostraBeta(1, 1, []float64{0.5, 0.5})
	if math.Abs(got-0.5) > 1e-9 {
		t.Errorf("amostraBeta(1,1,[0.5,0.5]) = %v, esperado 0.5", got)
	}
}

func TestAmostraBeta_UniformsIguaisEmAmbosOsLados(t *testing.T) {
	// successes=3,failures=3, todos os uniforms iguais -> cada Gamma é 3x o mesmo -ln(v), então o
	// fator 3 cancela e o resultado ainda é 0.5, independente do valor v escolhido.
	for _, v := range []float64{0.1, 0.3, 0.7, 0.9} {
		got := amostraBeta(3, 3, uniformSlice(6, v))
		if math.Abs(got-0.5) > 1e-9 {
			t.Errorf("amostraBeta(3,3, todos %v) = %v, esperado 0.5", v, got)
		}
	}
}

func TestAmostraBeta_MaisSucessosPuxaParaCimaComOsMesmosUniforms(t *testing.T) {
	// Mesmos uniforms nos dois braços, mas successes=5 > failures=1: mais termos negativos-log
	// somados do lado de sucesso empurra X pra cima de Y -> amostra > 0.5.
	uniforms := append(uniformSlice(5, 0.5), uniformSlice(1, 0.5)...)
	got := amostraBeta(5, 1, uniforms)
	if got <= 0.5 {
		t.Errorf("amostraBeta(5,1,...) = %v, esperado > 0.5 (mais sucessos)", got)
	}
}

// TestAmostraBeta_ConvergeParaMedia é uma propriedade estatística (não um valor exato) — média de
// muitas amostras de Beta(a,b) tende a a/(a+b). Usa math/rand real (não literais), então a
// tolerância é generosa; mesmo espírito da propriedade "gemas sempre entre 1 e 5" de
// TestRolarRecompensaBau, só que sobre a média em vez do intervalo.
func TestAmostraBeta_ConvergeParaMedia(t *testing.T) {
	casos := []struct {
		nome                string
		successes, failures int
	}{
		{"Beta(1,1): média 0.5", 1, 1},
		{"Beta(8,2): média 0.8", 8, 2},
		{"Beta(2,8): média 0.2", 2, 8},
		{"Beta(20,20): média 0.5", 20, 20},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			const n = 20000
			soma := 0.0
			for i := 0; i < n; i++ {
				soma += AmostrarBeta(c.successes, c.failures)
			}
			media := soma / n
			esperado := float64(c.successes) / float64(c.successes+c.failures)
			if math.Abs(media-esperado) > 0.02 {
				t.Errorf("média de %d amostras = %v, esperado perto de %v", n, media, esperado)
			}
		})
	}
}

func TestEscolherMaiorAmostra(t *testing.T) {
	got := escolherMaiorAmostra(map[TemplateID]float64{
		TemplateStreakRiscoClassico:    0.3,
		TemplateStreakRiscoEncorajador: 0.9,
		TemplateStreakRiscoCurto:       0.5,
	})
	if got != TemplateStreakRiscoEncorajador {
		t.Errorf("escolherMaiorAmostra = %q, esperado %q (maior amostra)", got, TemplateStreakRiscoEncorajador)
	}
}

func TestEscolherMaiorAmostra_UmSoCandidato(t *testing.T) {
	got := escolherMaiorAmostra(map[TemplateID]float64{TemplateStreakRiscoCurto: 0.01})
	if got != TemplateStreakRiscoCurto {
		t.Errorf("escolherMaiorAmostra = %q, esperado %q (único candidato)", got, TemplateStreakRiscoCurto)
	}
}

// TestSelecionarTemplate_ArmadoDisparadoQuaseSempreEscolhido é uma propriedade estatística:
// um template com sucesso esmagador (99 sucessos, 1 falha) deve ganhar a esmagadora maioria das
// rodadas contra um template neutro (1,1) — não sempre (Thompson Sampling explora por natureza),
// mas quase sempre.
func TestSelecionarTemplate_TemplateComMaisSucessoGanhaQuaseSempre(t *testing.T) {
	stats := map[TemplateID]TemplateStats{
		TemplateStreakRiscoClassico:    {Successes: 99, Failures: 1},
		TemplateStreakRiscoEncorajador: {Successes: 1, Failures: 99},
	}
	vitoriasClassico := 0
	const n = 1000
	for i := 0; i < n; i++ {
		if SelecionarTemplate(stats, nil) == TemplateStreakRiscoClassico {
			vitoriasClassico++
		}
	}
	if vitoriasClassico < n*90/100 {
		t.Errorf("template dominante venceu %d/%d rodadas, esperado pelo menos 90%%", vitoriasClassico, n)
	}
}

func TestSelecionarTemplate_RespeitaCooldown(t *testing.T) {
	stats := map[TemplateID]TemplateStats{
		TemplateStreakRiscoClassico:    {Successes: 99, Failures: 1}, // dominante, mas em cooldown
		TemplateStreakRiscoEncorajador: {Successes: 1, Failures: 1},
	}
	excluidos := map[TemplateID]bool{TemplateStreakRiscoClassico: true}
	for i := 0; i < 100; i++ {
		got := SelecionarTemplate(stats, excluidos)
		if got == TemplateStreakRiscoClassico {
			t.Fatalf("SelecionarTemplate escolheu um template em cooldown (%q)", got)
		}
	}
}

func TestSelecionarTemplate_TodosEmCooldownIgnoraCooldown(t *testing.T) {
	// Sem isso, um usuário com histórico curto (poucos templates, todos enviados recentemente)
	// nunca receberia notificação nenhuma até o cooldown expirar em todos — melhor repetir do que
	// ficar mudo.
	stats := map[TemplateID]TemplateStats{
		TemplateStreakRiscoClassico: {Successes: 1, Failures: 1},
	}
	excluidos := map[TemplateID]bool{TemplateStreakRiscoClassico: true}
	got := SelecionarTemplate(stats, excluidos)
	if got != TemplateStreakRiscoClassico {
		t.Errorf("SelecionarTemplate = %q, esperado %q (cooldown ignorado quando exclui todo mundo)", got, TemplateStreakRiscoClassico)
	}
}

func TestStreakRiscoMensagem(t *testing.T) {
	title, body := StreakRiscoMensagem(TemplateStreakRiscoClassico, 7)
	if title == "" || body == "" {
		t.Fatal("StreakRiscoMensagem devolveu title/body vazios pra template conhecido")
	}
	if !contains(body, "7") {
		t.Errorf("body = %q, esperado conter o streak atual (7)", body)
	}
}

func TestStreakRiscoMensagem_TemplateDesconhecido(t *testing.T) {
	title, body := StreakRiscoMensagem(TemplateID("nao_existe"), 7)
	if title != "" || body != "" {
		t.Errorf("StreakRiscoMensagem(desconhecido) = (%q, %q), esperado strings vazias", title, body)
	}
}

func contains(s, substr string) bool {
	for i := 0; i+len(substr) <= len(s); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
