// Algoritmos de negócio do domínio de gamificação — tradução direta de
// Docs/ArqLearn_TDD_Technical_Design_Document.md §3 (XP e limite diário), §4 (SRS) e §5.1
// (incremento de streak). Não alterar estes valores/fórmulas sem atualizar o TDD primeiro
// (ver Docs/CLAUDE.md, "Regras de negócio críticas").
package gamification

import (
	"math"
	"time"
)

// DailyXPCap é o teto de XP concedido por dia local do usuário (TDD §3.2). Atingi-lo nunca
// bloqueia a prática — só zera o XP concedido a partir dali (ver CalcularXP).
const DailyXPCap = 500

// DefaultEaseFactor é o ease_factor inicial de uma pergunta nunca vista (TDD §4.2).
const DefaultEaseFactor = 2.5

var basePorDificuldade = map[string]int{
	"easy": 10, "medium": 20, "hard": 30, "impossible": 40,
}

// limiarVelocidadeMs (TDD §3) é reutilizado também pelo mapeamento de qualidade do SRS (§4.1).
var limiarVelocidadeMs = map[string]int{
	"easy": 5000, "medium": 8000, "hard": 12000, "impossible": 17000,
}

// XPResult é o retorno de CalcularXP — xp_ganho e xp_daily_cap_reached da resposta de
// POST /v1/lessons/{lesson_id}/answers (API Spec §6).
type XPResult struct {
	XPConcedido     int
	DailyCapReached bool
}

// CalcularXP implementa TDD §3. xpToday é o valor já lido de user_gamification.xp_today
// (depois do reset preguiçoso — ver XPHojeAposReset) ANTES desta resposta ser contabilizada.
func CalcularXP(difficulty string, answerTimeMs int, isFirstCompletion, correct bool, xpToday int) XPResult {
	if !correct {
		return XPResult{}
	}

	base := basePorDificuldade[difficulty]
	bonusVelocidade := 0
	if answerTimeMs < limiarVelocidadeMs[difficulty] {
		bonusVelocidade = 5
	}
	bonusPrimeiraConclusao := 0
	if isFirstCompletion {
		bonusPrimeiraConclusao = 10
	}
	xpCalculado := base + bonusVelocidade + bonusPrimeiraConclusao

	xpDisponivelHoje := DailyXPCap - xpToday
	if xpDisponivelHoje < 0 {
		xpDisponivelHoje = 0
	}
	xpConcedido := xpCalculado
	if xpConcedido > xpDisponivelHoje {
		xpConcedido = xpDisponivelHoje
	}

	return XPResult{
		XPConcedido:     xpConcedido,
		DailyCapReached: xpConcedido < xpCalculado,
	}
}

// XPHojeAposReset aplica o reset preguiçoso do teto diário (TDD §3.2): se a última escrita foi
// num dia local diferente de hoje, xp_today volta a zero antes de qualquer novo XP ser somado.
func XPHojeAposReset(xpToday int, xpTodayDate, hojeLocal string) int {
	if xpTodayDate != hojeLocal {
		return 0
	}
	return xpToday
}

// Nivel implementa a curva de dificuldade progressiva intencional (TDD §3.1):
// nivel(xp_total) = floor(sqrt(xp_total / 100)) + 1.
func Nivel(xpTotal int) int {
	return int(math.Floor(math.Sqrt(float64(xpTotal)/100))) + 1
}

// SRSState espelha user_progress.srs_state (Database Design §4.4).
type SRSState struct {
	EaseFactor   float64
	IntervalDays int
}

// mapearQualidade (TDD §4.1) traduz certo/errado + tempo de resposta para a escala de
// qualidade 0–5 do SM-2 original.
func mapearQualidade(correct bool, answerTimeMs, limiarMs int) int {
	switch {
	case correct && answerTimeMs < limiarMs:
		return 5
	case correct:
		return 4
	case answerTimeMs > 2*limiarMs:
		return 2
	default:
		return 0
	}
}

// AtualizarSRS implementa TDD §4.2 (variação do SM-2). prev deve ser {DefaultEaseFactor, 0}
// para uma pergunta/lição nunca respondida antes.
func AtualizarSRS(prev SRSState, difficulty string, answerTimeMs int, correct bool) SRSState {
	q := mapearQualidade(correct, answerTimeMs, limiarVelocidadeMs[difficulty])

	if q >= 3 {
		var interval int
		switch prev.IntervalDays {
		case 0:
			interval = 1
		case 1:
			interval = 6
		default:
			interval = int(math.Round(float64(prev.IntervalDays) * prev.EaseFactor))
		}
		ef := prev.EaseFactor + (0.1 - float64(5-q)*(0.08+float64(5-q)*0.02))
		return SRSState{EaseFactor: max(1.3, ef), IntervalDays: interval}
	}

	return SRSState{EaseFactor: max(1.3, prev.EaseFactor-0.2), IntervalDays: 1}
}

// NextReviewAt aplica o interval_days resultante de AtualizarSRS a partir de "now".
func NextReviewAt(now time.Time, intervalDays int) time.Time {
	return now.AddDate(0, 0, intervalDays)
}

// StreakState espelha os campos de streak de user_gamification (Database Design §3.2).
type StreakState struct {
	Current        int
	Best           int
	LastActiveDate string // formato YYYY-MM-DD, no fuso local do usuário
}

// AtualizarStreak implementa TDD §5.1: incrementa no máximo uma vez por dia local do usuário,
// independentemente de quantas lições forem concluídas naquele dia.
func AtualizarStreak(prev StreakState, hojeLocal string) StreakState {
	if prev.LastActiveDate == hojeLocal {
		return prev
	}
	current := prev.Current + 1
	best := prev.Best
	if current > best {
		best = current
	}
	return StreakState{Current: current, Best: best, LastActiveDate: hojeLocal}
}

// HojeLocal calcula a data (YYYY-MM-DD) de "now" no fuso IANA informado — usado por
// CalcularXP (via XPHojeAposReset) e AtualizarStreak. Faz fallback para UTC se o fuso for
// inválido, em vez de derrubar a requisição por causa de timezone malformado.
func HojeLocal(timezone string, now time.Time) string {
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		loc = time.UTC
	}
	return now.In(loc).Format("2006-01-02")
}

// HeartsMax e HeartsRegenInterval implementam TDD §5.4: uma vida regenera a cada 3h até o teto
// de 5, calculado de forma preguiçosa (sem job) sempre que hearts_current/hearts_updated_at são
// lidos — ver RegenerarVidas e LoadHeartsWithRegen.
const HeartsMax = 5
const HeartsRegenInterval = 3 * time.Hour

// RegenerarVidas implementa TDD §5.4. heartsUpdatedAt é o instante da última mudança no contador
// (perda ou regeneração, nunca "última vez que o endpoint rodou"). Devolve o novo total de vidas
// e o novo heartsUpdatedAt — quando nenhum tique completo se passou, devolve os valores de
// entrada inalterados (chamador não precisa persistir nesse caso).
func RegenerarVidas(heartsCurrent int, heartsUpdatedAt, now time.Time) (int, time.Time) {
	if heartsCurrent >= HeartsMax {
		return heartsCurrent, heartsUpdatedAt
	}

	elapsed := now.Sub(heartsUpdatedAt)
	ticks := int(elapsed / HeartsRegenInterval)
	if ticks <= 0 {
		return heartsCurrent, heartsUpdatedAt
	}

	novo := heartsCurrent + ticks
	if novo >= HeartsMax {
		return HeartsMax, now
	}
	// Avança o relógio só pelos ticks realmente aplicados — preserva o progresso parcial do
	// próximo tique em vez de resetar pra "agora" (ver TDD §5.4, exemplo do intervalo de 4h20).
	return novo, heartsUpdatedAt.Add(time.Duration(ticks) * HeartsRegenInterval)
}

// ProximaVidaEm devolve o instante da próxima regeneração, ou nil quando já está no teto — é
// exatamente GamificationProfile.hearts_next_at (API Spec §3.2).
func ProximaVidaEm(heartsCurrent int, heartsUpdatedAt time.Time) *time.Time {
	if heartsCurrent >= HeartsMax {
		return nil
	}
	next := heartsUpdatedAt.Add(HeartsRegenInterval)
	return &next
}
