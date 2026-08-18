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

// VIPXPMultiplier é o bônus de XP do VIP (a pedido do usuário: "+25% de XP") — aplicado por
// resposta, ANTES do teto diário (DailyXPCap continua valendo 500/dia igual pra todo mundo; VIP só
// alcança o teto mais rápido, não ganha um teto maior).
const VIPXPMultiplier = 1.25

// CalcularXP implementa TDD §3. xpToday é o valor já lido de user_gamification.xp_today
// (depois do reset preguiçoso — ver XPHojeAposReset) ANTES desta resposta ser contabilizada.
// vipAtivo aplica VIPXPMultiplier (ver EhVIPAtivo) antes do teto diário.
func CalcularXP(difficulty string, answerTimeMs int, isFirstCompletion, correct bool, xpToday int, vipAtivo bool) XPResult {
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
	if vipAtivo {
		xpCalculado = int(math.Round(float64(xpCalculado) * VIPXPMultiplier))
	}

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

// AplicarExpiracaoStreak implementa TDD §5.2/§5.3 de forma preguiçosa (mesmo padrão de
// RegenerarVidas): calculada sob demanda a cada leitura/escrita de gamificação, sem job/cron —
// esta fase bootstrap não tem scheduler automático (mesma decisão já tomada pra CloseLeagueWeek,
// ver internal/gamification/gamification.go). streakLastActiveDate e hojeLocal são strings
// "YYYY-MM-DD" no fuso do usuário (mesmo formato de HojeLocal/AtualizarStreak).
//
// Regra: se a última prática foi hoje ou ontem, a streak está intacta (TDD §5.1 já garante no
// máximo 1 incremento por dia, então "ontem" é sempre o caso normal de quem ainda não praticou
// hoje). Se pulou 2+ dias sem prática: consome 1 streak_freeze automaticamente se disponível
// (streak_current preservado) — um gap de N dias consome até N freezes, um por dia faltante, até
// acabarem, MAS um por avaliação, não N de uma vez (ver nota abaixo) —, ou zera streak_current se
// não houver freeze (expirou=true).
//
// novaLastActiveDate avança pra "ontem" quando um freeze é consumido — NÃO pra hoje (o usuário
// ainda precisa praticar hoje pra manter a sequência viva, TDD §5.3) — só o suficiente pra essa
// mesma avaliação não se repetir a cada request do resto do dia (chamador persiste esse valor de
// volta). Sem isso, o caller re-executaria esta função em toda leitura de gamificação do dia
// (GET /v1/gamification/me, GET /v1/users/me, cada pergunta de POST .../answers) e consumiria um
// freeze por request em vez de um por dia — bug real encontrado ao vivo (Playwright, ver
// PENDENCIAS_MOBILE.md) antes desta correção. Se o usuário sumir por N dias e só abrir o app uma
// vez depois, essa única avaliação processa 1 dia do gap (não os N de uma vez); reabrir o app nos
// dias seguintes sem praticar processa mais um dia por vez, até os freezes acabarem ou a pessoa
// praticar de novo — simulação lazy do job diário do TDD (que rodaria uma vez por virada de dia).
func AplicarExpiracaoStreak(streakCurrent int, streakLastActiveDate string, freezesAvailable int, hojeLocal string) (novoStreakCurrent int, novaLastActiveDate string, novosFreezes int, expirou bool) {
	if streakCurrent == 0 || streakLastActiveDate == "" || streakLastActiveDate == hojeLocal {
		return streakCurrent, streakLastActiveDate, freezesAvailable, false
	}

	hoje, err := time.Parse("2006-01-02", hojeLocal)
	if err != nil {
		return streakCurrent, streakLastActiveDate, freezesAvailable, false
	}
	ontem := hoje.AddDate(0, 0, -1).Format("2006-01-02")
	if streakLastActiveDate == ontem {
		return streakCurrent, streakLastActiveDate, freezesAvailable, false
	}

	if freezesAvailable > 0 {
		return streakCurrent, ontem, freezesAvailable - 1, false
	}
	return 0, streakLastActiveDate, freezesAvailable, true
}

// StreakEmRisco é TDD §5.2 (aviso preventivo) calculado ao vivo: streak positiva e a pessoa ainda
// não praticou hoje. Fica true todo santo dia até a prática de hoje acontecer (sem "janela antes
// da meia-noite" do job original — não tem como saber a hora aqui, só a data) — é exatamente o
// gatilho do prompt de "usar bloqueio de ofensiva agora" ao abrir o app.
func StreakEmRisco(streakCurrent int, streakLastActiveDate, hojeLocal string) bool {
	return streakCurrent > 0 && streakLastActiveDate != hojeLocal
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

// ChestQuestionsRequired é quantas respostas CERTAS no dia local (lição OU Modo Infinito, contagem
// acumulada) liberam o Baú Diário pra abrir. Antes de 18/08/2026 contava toda resposta (certa ou
// errada); mudou a pedido do usuário após achado em teste ao vivo em device real (ver
// Docs/PENDENCIAS_TESTE_DEVICE.md).
const ChestQuestionsRequired = 10

// QuestoesHojeAposReset aplica o mesmo reset preguiçoso de XPHojeAposReset (TDD §3.2) pro contador
// de perguntas do dia que libera o Baú Diário: muda de dia local, volta a zero antes de contar a
// resposta atual.
func QuestoesHojeAposReset(questoesHoje int, questoesHojeDate, hojeLocal string) int {
	if questoesHojeDate != hojeLocal {
		return 0
	}
	return questoesHoje
}

// ChestRewardType é o tipo de recompensa sorteada ao abrir o Baú Diário.
type ChestRewardType string

const (
	ChestRewardGems         ChestRewardType = "gems"
	ChestRewardStreakFreeze ChestRewardType = "streak_freeze"
	ChestRewardHeartsRefill ChestRewardType = "hearts_refill"
)

// ChestReward é o resultado de RolarRecompensaBau.
type ChestReward struct {
	Type ChestRewardType
	// GemsAmount só é preenchido quando Type == ChestRewardGems (1 a 5, ver RolarRecompensaBau).
	GemsAmount int
}

// RolarRecompensaBau sorteia a recompensa do Baú Diário — a pedido do usuário: gemas (1 a 5) na
// maioria das vezes, ou um item grátis do sistema como prêmio mais raro (metade Bloqueio de
// Ofensiva, metade Recarga de Vidas — os dois itens consumíveis reais da Loja, ver
// migrations/0004_shop_items_seed; cosméticos ficam de fora do pool, caro demais pra sair de
// graça todo dia). rollType decide o tipo (gemas vs item), rollDetail decide o detalhe dentro do
// tipo escolhido (quantidade de gemas, ou qual item) — os dois em [0,1), o chamador HTTP gera com
// math/rand. Pura e determinística pros dois floats de entrada, pra dar pra testar sem mockar RNG.
func RolarRecompensaBau(rollType, rollDetail float64) ChestReward {
	const probabilidadeGemas = 0.75
	if rollType < probabilidadeGemas {
		gemsAmount := 1 + int(rollDetail*5)
		if gemsAmount > 5 {
			gemsAmount = 5
		}
		return ChestReward{Type: ChestRewardGems, GemsAmount: gemsAmount}
	}
	if rollDetail < 0.5 {
		return ChestReward{Type: ChestRewardStreakFreeze}
	}
	return ChestReward{Type: ChestRewardHeartsRefill}
}

// EhVIPAtivo decide se o VIP está em vigor agora — expiração preguiçosa (mesmo padrão de
// RegenerarVidas/AplicarExpiracaoStreak, sem job/cron): isVip=false nunca é VIP, vipExpiresAt=nil
// com isVip=true é VIP vitalício (nunca expira), e qualquer vipExpiresAt no passado desliga o VIP
// sem precisar zerar is_vip em lugar nenhum — a próxima leitura já reflete a expiração sozinha.
func EhVIPAtivo(isVip bool, vipExpiresAt *time.Time, now time.Time) bool {
	if !isVip {
		return false
	}
	if vipExpiresAt == nil {
		return true
	}
	return now.Before(*vipExpiresAt)
}

// VIPDailyChestResetsMax é quantas vezes o VIP pode resetar o Baú Diário no mesmo dia local (a
// pedido do usuário: "resetar o baú diário mais uma vez por dia") — usuário comum não tem essa
// opção (LoadDailyChestStatus nem expõe a rota de reset pra quem não é VIP).
const VIPDailyChestResetsMax = 1

// VIPWeeklyChestResetsMax é quantas vezes o VIP pode resetar o Baú Semanal no mesmo ciclo de 7
// dias (a pedido do usuário: "2x reset do baú semanal por semana").
const VIPWeeklyChestResetsMax = 2

// EstenderVIP calcula a nova vip_expires_at ao resgatar um cupom (ou, futuramente, confirmar uma
// assinatura) — pura e testável, mesmo estilo dos outros helpers de gamificação. Regras:
//   - VIP vitalício (is_vip=true, vip_expires_at=nil) permanece vitalício — um cupom nunca
//     "encolhe" um benefício já concedido sem prazo, então devolve nil de novo.
//   - VIP ainda ativo (não vitalício): soma durationDays a partir da expiração atual, não de
//     "agora" — resgatar um cupom antes do anterior acabar empilha os dias em vez de desperdiçar o
//     que sobrava.
//   - Sem VIP ativo (nunca teve ou já expirou): conta durationDays a partir de agora.
func EstenderVIP(isVip bool, vipExpiresAt *time.Time, now time.Time, durationDays int) *time.Time {
	if EhVIPAtivo(isVip, vipExpiresAt, now) && vipExpiresAt == nil {
		return nil
	}
	base := now
	if EhVIPAtivo(isVip, vipExpiresAt, now) {
		base = *vipExpiresAt
	}
	novaExpiracao := base.AddDate(0, 0, durationDays)
	return &novaExpiracao
}

// VIPResetsAposReset aplica o mesmo reset preguiçoso de QuestoesHojeAposReset/
// QuestoesSemanaAposReset ao contador de resets VIP já usados: comparado contra o período vigente
// (data local pro diário, cycle_start vigente do Baú Semanal pro semanal — não um ciclo próprio),
// volta a zero quando o período mudou. Serve pros dois casos (diário e semanal) porque a
// comparação é a mesma forma, só o "período" de entrada muda (data vs. cycle_start).
func VIPResetsAposReset(resetsUsados int, periodoSalvo, periodoVigente string) int {
	if periodoSalvo != periodoVigente {
		return 0
	}
	return resetsUsados
}

// ChestWeeklyQuestionsRequired é quantas perguntas respondidas dentro do ciclo vigente (ver
// QuestoesSemanaAposReset) liberam o Baú Semanal pra abrir.
const ChestWeeklyQuestionsRequired = 50

// ChestWeeklyCycleDays é o tamanho da janela rolante do ciclo semanal — não é "semana de
// calendário" nenhuma, é sempre 7 dias a partir de chest_weekly_cycle_start (a data da primeira
// pergunta do ciclo vigente).
const ChestWeeklyCycleDays = 7

// QuestoesSemanaAposReset decide o contador e o início de ciclo vigentes pro Baú Semanal: sem
// ciclo ativo ainda (cicloInicio vazio) ou com 7 dias já passados desde cicloInicio, o ciclo
// reseta — contador volta a zero e um novo ciclo começa hoje. Espelha QuestoesHojeAposReset, mas
// com janela de N dias em vez de igualdade de data — decisão explícita do usuário: abrir o baú
// antes do fim do ciclo NÃO adianta o reset, só a passagem dos 7 dias reseta (chest_weekly_
// claimed_cycle_start cuida de travar a abertura repetida dentro do mesmo ciclo, ver
// LoadWeeklyChestStatus).
func QuestoesSemanaAposReset(questoesSemana int, cicloInicio, hojeLocal string) (int, string) {
	if cicloInicio == "" {
		return 0, hojeLocal
	}
	inicio, err := time.Parse("2006-01-02", cicloInicio)
	if err != nil {
		return 0, hojeLocal
	}
	hoje, err := time.Parse("2006-01-02", hojeLocal)
	if err != nil {
		return 0, hojeLocal
	}
	diasPassados := int(hoje.Sub(inicio).Hours() / 24)
	if diasPassados >= ChestWeeklyCycleDays {
		return 0, hojeLocal
	}
	return questoesSemana, cicloInicio
}

// RolarRecompensaBauSemanal sorteia a recompensa do Baú Semanal — recompensa maior que a do Baú
// Diário (a pedido do usuário, já que exige 5x mais esforço: 50 perguntas dentro de 7 dias em vez
// de 10 num dia): gemas (5 a 15, contra 1 a 5 do diário) com probabilidade menor de sair (60%
// contra 75%), deixando o item grátis do sistema (mesmos dois itens do Baú Diário, ver
// RolarRecompensaBau) mais provável (40% contra 25%). Mesma assinatura pura/determinística.
func RolarRecompensaBauSemanal(rollType, rollDetail float64) ChestReward {
	const probabilidadeGemas = 0.60
	if rollType < probabilidadeGemas {
		gemsAmount := 5 + int(rollDetail*11)
		if gemsAmount > 15 {
			gemsAmount = 15
		}
		return ChestReward{Type: ChestRewardGems, GemsAmount: gemsAmount}
	}
	if rollDetail < 0.5 {
		return ChestReward{Type: ChestRewardStreakFreeze}
	}
	return ChestReward{Type: ChestRewardHeartsRefill}
}
