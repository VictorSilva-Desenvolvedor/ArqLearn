// Bandit de template (Thompson Sampling, Beta-Bernoulli) — TDD §11. Escolhe qual variação de
// mensagem enviar em cada gatilho, aprendendo a partir da recompensa observada (usuário praticou
// nas 24h seguintes ao envio ou não — ver decide.go). Item (a dificuldade do "braço") nunca muda:
// só a estatística de sucesso/falha de cada template se move.
package notifications

import (
	"fmt"
	"math"
	"math/rand"
)

// TemplateID identifica uma variação de mensagem — é a chave usada em notification_template_stats
// e notification_sends (migrations/0018). Mudar o VALOR de uma constante depois de já ter
// estatística acumulada equivale a aposentar aquele template e lançar um novo do zero (prior
// (1,1) de novo, sem herdar nada do anterior) — não é um rename inofensivo.
type TemplateID string

const (
	TemplateStreakRiscoClassico    TemplateID = "streak_risco_classico"
	TemplateStreakRiscoEncorajador TemplateID = "streak_risco_encorajador"
	TemplateStreakRiscoCurto       TemplateID = "streak_risco_curto"
	TemplateStreakRiscoPergunta    TemplateID = "streak_risco_pergunta"
)

// TriggerStreakAtRisk é o único gatilho real hoje — mesmo valor já usado como
// notifications.type ("streak_at_risk") e como trigger_type em notification_template_stats/
// notification_sends.
const TriggerStreakAtRisk = "streak_at_risk"

// streakRiscoTemplates: 4 variações reais pro gatilho de streak em risco, tom encorajador — não
// ameaça/culpa (RX-05, Docs/ArqLearn_Backlog_Gamificacao_Atelie.md §2.4 ponto 9). A primeira
// (Classico) é a mensagem original que já estava em produção antes desta mudança, mantida como
// controle na comparação; as outras três são novas.
var streakRiscoTemplates = map[TemplateID]struct {
	title string
	body  func(streakCurrent int) string
}{
	TemplateStreakRiscoClassico: {
		title: "Sua sequência está em risco!",
		body: func(streakCurrent int) string {
			return fmt.Sprintf("Sua sequência de %d dias está em risco! Pratique hoje pra não perdê-la.", streakCurrent)
		},
	},
	TemplateStreakRiscoEncorajador: {
		title: "Falta pouco pra fechar o dia",
		body: func(streakCurrent int) string {
			return fmt.Sprintf("Você já tem %d dias seguidos de prática — uma lição rápida hoje mantém a sequência viva.", streakCurrent)
		},
	},
	TemplateStreakRiscoCurto: {
		title: "Sua vez de praticar",
		body: func(streakCurrent int) string {
			return fmt.Sprintf("Ainda dá tempo hoje. Sequência atual: %d dias.", streakCurrent)
		},
	},
	TemplateStreakRiscoPergunta: {
		title: "Já estudou hoje?",
		body: func(streakCurrent int) string {
			return fmt.Sprintf("Sua sequência de %d dias te espera — bora manter o ritmo?", streakCurrent)
		},
	},
}

// StreakRiscoMensagem devolve (title, body) do template escolhido pro gatilho de streak em risco
// — title vai no push, body no push e na notificação in-app (mesmo par usado por
// expo.SendPush/Create, ver decide.go). Segundo argumento vazio (template desconhecido) não deveria
// acontecer em produção — só possível se um TemplateID novo for adicionado ao mapa de stats sem
// entrada correspondente aqui; devolve strings vazias em vez de pânico, chamador decide o que fazer.
func StreakRiscoMensagem(id TemplateID, streakCurrent int) (title, body string) {
	tmpl, ok := streakRiscoTemplates[id]
	if !ok {
		return "", ""
	}
	return tmpl.title, tmpl.body(streakCurrent)
}

// amostraBeta amostra Beta(successes, failures) pela identidade exata (não aproximação):
// Gamma(k,1) pra k inteiro positivo é a soma de k amostras Exponential(1) (-ln(U), U~Uniforme(0,1));
// Beta(a,b) = X/(X+Y) com X~Gamma(a,1), Y~Gamma(b,1) independentes. uniforms precisa ter
// exatamente successes+failures entradas em [0,1) — os primeiros `successes` alimentam X, o resto
// alimenta Y. Pura e testável, mesmo espírito de RolarRecompensaBau
// (internal/gamification/algorithms.go): a aleatoriedade entra só como argumento, nunca lida de
// um RNG global escondido dentro da função.
func amostraBeta(successes, failures int, uniforms []float64) float64 {
	gammaSum := func(u []float64) float64 {
		sum := 0.0
		for _, v := range u {
			sum += -math.Log(v)
		}
		return sum
	}
	x := gammaSum(uniforms[:successes])
	y := gammaSum(uniforms[successes:])
	return x / (x + y)
}

// AmostrarBeta é o wrapper impuro de amostraBeta — gera os floats aleatórios num loop, mesmo
// espírito de RolarRecompensaBau(rand.Float64(), rand.Float64()) só que com uma quantidade
// variável de sorteios (successes+failures cresce com o histórico, ao contrário do sorteio fixo
// de baú).
func AmostrarBeta(successes, failures int) float64 {
	uniforms := make([]float64, successes+failures)
	for i := range uniforms {
		uniforms[i] = rand.Float64()
	}
	return amostraBeta(successes, failures, uniforms)
}

// TemplateStats espelha uma linha de notification_template_stats.
type TemplateStats struct {
	Successes int
	Failures  int
}

// escolherMaiorAmostra devolve o TemplateID de maior amostra — pura, argmax trivial, testável sem
// nenhum RNG (o sorteio já aconteceu antes, em SelecionarTemplate).
func escolherMaiorAmostra(amostras map[TemplateID]float64) TemplateID {
	var melhor TemplateID
	melhorValor := -1.0
	for id, v := range amostras {
		if v > melhorValor {
			melhorValor = v
			melhor = id
		}
	}
	return melhor
}

// SelecionarTemplate escolhe o template do trigger via Thompson Sampling, ignorando qualquer
// template em `excluidos` (cooldown — ver decide.go). Impura (chama AmostrarBeta por template
// elegível); o argmax em si fica isolado em escolherMaiorAmostra, pura.
func SelecionarTemplate(stats map[TemplateID]TemplateStats, excluidos map[TemplateID]bool) TemplateID {
	amostras := make(map[TemplateID]float64, len(stats))
	for id, s := range stats {
		if excluidos[id] {
			continue
		}
		amostras[id] = AmostrarBeta(s.Successes, s.Failures)
	}
	if len(amostras) == 0 {
		// Cooldown excluiu todo mundo (histórico curto, poucos templates) — melhor repetir um
		// template recente do que não mandar nada; ignora o cooldown pra esta rodada.
		for id, s := range stats {
			amostras[id] = AmostrarBeta(s.Successes, s.Failures)
		}
	}
	return escolherMaiorAmostra(amostras)
}
