// Package gamification cobre o Gamification Service (SAD §8.6 / API Spec §8).
// Regras de negócio (calcularXP, limite diário de XP, streak, ligas) vêm do
// Docs/ArqLearn_TDD_Technical_Design_Document.md — não reimplementar de memória.
package gamification

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"arqlearn/monolith/internal/apierror"
	"arqlearn/monolith/internal/authmiddleware"
)

func RegisterRoutes(mux *http.ServeMux, pool *pgxpool.Pool, verifier *authmiddleware.Verifier) {
	mux.Handle("GET /v1/gamification/me", verifier.Middleware(http.HandlerFunc(handleGetGamificationMe(pool))))
	mux.Handle("GET /v1/gamification/league", verifier.Middleware(http.HandlerFunc(handleGetLeague(pool))))
	mux.Handle("POST /v1/gamification/streak/freeze", verifier.Middleware(http.HandlerFunc(handleStreakFreeze(pool))))
	mux.Handle("POST /v1/gamification/shop/purchase", verifier.Middleware(http.HandlerFunc(handleShopPurchase(pool))))
	mux.Handle("GET /v1/gamification/daily-chest", verifier.Middleware(http.HandlerFunc(handleGetDailyChestStatus(pool))))
	mux.Handle("POST /v1/gamification/daily-chest/open", verifier.Middleware(http.HandlerFunc(handleOpenDailyChest(pool))))
	mux.Handle("GET /v1/gamification/weekly-chest", verifier.Middleware(http.HandlerFunc(handleGetWeeklyChestStatus(pool))))
	mux.Handle("POST /v1/gamification/weekly-chest/open", verifier.Middleware(http.HandlerFunc(handleOpenWeeklyChest(pool))))
	mux.Handle("POST /v1/gamification/daily-chest/reset", verifier.Middleware(http.HandlerFunc(handleResetDailyChest(pool))))
	mux.Handle("POST /v1/gamification/weekly-chest/reset", verifier.Middleware(http.HandlerFunc(handleResetWeeklyChest(pool))))
	mux.Handle("GET /v1/vip/status", verifier.Middleware(http.HandlerFunc(handleGetVIPStatus(pool))))
	mux.Handle("POST /v1/vip/coupons", verifier.Middleware(http.HandlerFunc(handleCreateVIPCoupon(pool))))
	mux.Handle("POST /v1/vip/coupons/redeem", verifier.Middleware(http.HandlerFunc(handleRedeemVIPCoupon(pool))))
	mux.Handle("POST /v1/vip/subscribe", verifier.Middleware(http.HandlerFunc(handleSubscribeVIP(pool))))
}

// --- GET /v1/gamification/me ---

type achievementJSON struct {
	Type       string    `json:"type"`
	UnlockedAt time.Time `json:"unlocked_at"`
}

// CosmeticJSON: item da loja category='cosmetic' que o usuário já possui (user_cosmetics,
// migration 0015). Equipped sempre true por ora (ver comentário em handleShopPurchase) — o
// campo já viaja no contrato pra não quebrar o cliente quando um toggle de equipar existir.
// Exportado (não cosmeticJSON) porque internal/users.handleGetMe também precisa dele — mesmo
// padrão de LoadHeartsWithRegen/LoadStreakWithExpiration/LoadLeagueTierName logo abaixo.
type CosmeticJSON struct {
	ItemID     string    `json:"item_id"`
	Name       string    `json:"name"`
	Equipped   bool      `json:"equipped"`
	AcquiredAt time.Time `json:"acquired_at"`
}

// LoadOwnedCosmetics devolve os cosméticos que o usuário já possui (user_cosmetics join
// shop_items), mais recentes primeiro. Chamada por GET /v1/gamification/me e GET /v1/users/me —
// as duas rotas que hoje expõem o perfil de gamificação inteiro pro cliente.
func LoadOwnedCosmetics(ctx context.Context, pool *pgxpool.Pool, userID string) ([]CosmeticJSON, error) {
	rows, err := pool.Query(ctx, `
		SELECT si.id, si.name, uc.equipped, uc.acquired_at
		FROM user_cosmetics uc JOIN shop_items si ON si.id = uc.item_id
		WHERE uc.user_id = $1 ORDER BY uc.acquired_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	cosmetics := []CosmeticJSON{}
	for rows.Next() {
		var c CosmeticJSON
		if err := rows.Scan(&c.ItemID, &c.Name, &c.Equipped, &c.AcquiredAt); err != nil {
			return nil, err
		}
		cosmetics = append(cosmetics, c)
	}
	return cosmetics, rows.Err()
}

type gamificationMeResponse struct {
	XPTotal                int `json:"xp_total"`
	XPToday                int `json:"xp_today"`
	Level                  int `json:"level"`
	StreakCurrent          int `json:"streak_current"`
	StreakBest             int `json:"streak_best"`
	StreakFreezesAvailable int `json:"streak_freezes_available"`
	// StreakAtRisco = tem streak positiva e ainda não praticou hoje (TDD §5.2, calculado ao vivo
	// — ver StreakEmRisco) — gatilho do cliente pra oferecer usar um Bloqueio de Ofensiva assim
	// que o app abre, em vez de só descobrir a perda no dia seguinte.
	StreakAtRisk  bool              `json:"streak_at_risk"`
	HeartsCurrent int               `json:"hearts_current"`
	HeartsNextAt  *time.Time        `json:"hearts_next_at"`
	Gems          int               `json:"gems"`
	LeagueTier    *string           `json:"league_tier"`
	Achievements  []achievementJSON `json:"achievements"`
	Cosmetics     []CosmeticJSON    `json:"cosmetics"`
	IsVIP         bool              `json:"is_vip"`
	VIPExpiresAt  *time.Time        `json:"vip_expires_at"`
	// XPBoostActive/XPBoostActiveUntil (TDD §3.3) — mesmo par de is_vip/vip_expires_at, mas
	// XPBoostActiveUntil=nil sempre significa "sem boost ativo" (nunca "vitalício").
	XPBoostActive      bool       `json:"xp_boost_active"`
	XPBoostActiveUntil *time.Time `json:"xp_boost_active_until"`
}

// LoadHeartsWithRegen lê hearts_current/hearts_updated_at, aplica a regeneração preguiçosa (TDD
// §5.4) e persiste de volta só quando algo de fato mudou — chamada por toda rota que lê ou
// consome vidas (aqui, POST /v1/lessons/{lesson_id}/session e POST .../answers), pra nenhuma
// delas enxergar um contador desatualizado. heartsNextAt vem nil quando já está no teto (5).
func LoadHeartsWithRegen(ctx context.Context, pool *pgxpool.Pool, userID string) (heartsCurrent int, heartsNextAt *time.Time, err error) {
	var updatedAt time.Time
	var isVip bool
	var vipExpiresAt *time.Time
	if err = pool.QueryRow(ctx,
		`SELECT hearts_current, hearts_updated_at, is_vip, vip_expires_at FROM user_gamification WHERE user_id = $1`, userID,
	).Scan(&heartsCurrent, &updatedAt, &isVip, &vipExpiresAt); err != nil {
		return 0, nil, err
	}

	now := time.Now().UTC()
	vipAtivo := EhVIPAtivo(isVip, vipExpiresAt, now)
	novo, novoUpdatedAt := RegenerarVidas(heartsCurrent, updatedAt, now, vipAtivo)
	if novo != heartsCurrent || !novoUpdatedAt.Equal(updatedAt) {
		if _, err = pool.Exec(ctx,
			`UPDATE user_gamification SET hearts_current = $1, hearts_updated_at = $2 WHERE user_id = $3`,
			novo, novoUpdatedAt, userID,
		); err != nil {
			return 0, nil, err
		}
	}

	return novo, ProximaVidaEm(novo, novoUpdatedAt, vipAtivo), nil
}

// StreakSnapshot é o retorno de LoadStreakWithExpiration — já reflete a expiração aplicada (se
// houve) e diz se a streak está em risco hoje.
type StreakSnapshot struct {
	Current          int
	Best             int
	FreezesAvailable int
	AtRisk           bool
}

// LoadStreakWithExpiration lê streak_current/streak_last_active_date/streak_freezes_available
// (fazendo join com users só pra pegar o timezone, necessário pra calcular "hoje" no fuso certo),
// aplica a expiração preguiçosa (TDD §5.2/§5.3 — ver AplicarExpiracaoStreak) e persiste de volta
// só quando algo de fato mudou, mesmo padrão de LoadHeartsWithRegen. Chamada por toda rota que lê
// gamificação (GET /v1/gamification/me, GET /v1/users/me) e por POST .../answers antes de
// AtualizarStreak, pra nenhuma delas incrementar um streak_current que já deveria ter expirado.
//
// Esta é uma das DUAS chamadas independentes de AplicarExpiracaoStreak no código (a outra é em
// internal/learning/answers.go) — cada uma com sua própria leitura/escrita, não um caminho
// compartilhado. Por isso o reparo de streak (RS-08, TDD §5.5) precisa ser preparado aqui também:
// um usuário que abre o app (GET, não resposta de lição) depois da streak já ter estourado teria a
// streak zerada por esta função sem nenhum registro de reparo, se só answers.go soubesse fazer
// isso — GET /me é quase sempre a primeira chamada de qualquer sessão de uso.
func LoadStreakWithExpiration(ctx context.Context, pool *pgxpool.Pool, userID string) (StreakSnapshot, error) {
	var current, best, freezesAvailable int
	var lastActiveDate *time.Time
	var timezone string
	var repairValue *int
	var repairDeadline *time.Time
	if err := pool.QueryRow(ctx, `
		SELECT g.streak_current, g.streak_best, g.streak_last_active_date, g.streak_freezes_available,
		       g.streak_repair_value, g.streak_repair_deadline, u.timezone
		FROM user_gamification g JOIN users u ON u.id = g.user_id
		WHERE g.user_id = $1
	`, userID).Scan(&current, &best, &lastActiveDate, &freezesAvailable, &repairValue, &repairDeadline, &timezone); err != nil {
		return StreakSnapshot{}, err
	}

	lastActiveStr := ""
	if lastActiveDate != nil {
		lastActiveStr = lastActiveDate.Format("2006-01-02")
	}
	hojeLocal := HojeLocal(timezone, time.Now())

	currentAntesDaExpiracao := current
	novoCurrent, novaLastActiveStr, novosFreezes, expirou := AplicarExpiracaoStreak(current, lastActiveStr, freezesAvailable, hojeLocal)
	if novoCurrent != current || novosFreezes != freezesAvailable || novaLastActiveStr != lastActiveStr {
		var novaLastActiveParam any
		if novaLastActiveStr != "" {
			d, _ := time.Parse("2006-01-02", novaLastActiveStr)
			novaLastActiveParam = d
		}

		var novoRepairValueParam, novoRepairDeadlineParam any
		if repairValue != nil {
			novoRepairValueParam, novoRepairDeadlineParam = *repairValue, *repairDeadline
		}
		if expirou && currentAntesDaExpiracao > 0 {
			rv, rd := PrepararReparoStreak(currentAntesDaExpiracao, hojeLocal)
			novoRepairValueParam = rv
			d, _ := time.Parse("2006-01-02", rd)
			novoRepairDeadlineParam = d
			RecordEvent(ctx, pool, userID, EventStreakReset, &currentAntesDaExpiracao, map[string]any{"schema_version": 1})
		} else if novosFreezes < freezesAvailable {
			RecordEvent(ctx, pool, userID, EventStreakFreezeConsumed, nil, map[string]any{"schema_version": 1})
		}

		if _, err := pool.Exec(ctx,
			`UPDATE user_gamification SET streak_current = $1, streak_freezes_available = $2, streak_last_active_date = $3,
			   streak_repair_value = $4, streak_repair_deadline = $5 WHERE user_id = $6`,
			novoCurrent, novosFreezes, novaLastActiveParam, novoRepairValueParam, novoRepairDeadlineParam, userID,
		); err != nil {
			return StreakSnapshot{}, err
		}
		current, freezesAvailable, lastActiveStr = novoCurrent, novosFreezes, novaLastActiveStr
	}
	if best < current {
		best = current
	}

	return StreakSnapshot{
		Current:          current,
		Best:             best,
		FreezesAvailable: freezesAvailable,
		AtRisk:           StreakEmRisco(current, lastActiveStr, hojeLocal),
	}, nil
}

func handleGetGamificationMe(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var resp gamificationMeResponse
		var isVipRaw bool
		err := pool.QueryRow(r.Context(), `
			SELECT xp_total, xp_today, level, gems, is_vip, vip_expires_at, xp_boost_active_until
			FROM user_gamification WHERE user_id = $1
		`, userID).Scan(&resp.XPTotal, &resp.XPToday, &resp.Level, &resp.Gems, &isVipRaw, &resp.VIPExpiresAt, &resp.XPBoostActiveUntil)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusNotFound, "USER_PROFILE_NOT_FOUND", "Perfil de usuário não encontrado.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar gamificação.")
			return
		}

		streak, err := LoadStreakWithExpiration(r.Context(), pool, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar streak.")
			return
		}
		resp.StreakCurrent = streak.Current
		resp.StreakBest = streak.Best
		resp.StreakFreezesAvailable = streak.FreezesAvailable
		resp.StreakAtRisk = streak.AtRisk

		resp.HeartsCurrent, resp.HeartsNextAt, err = LoadHeartsWithRegen(r.Context(), pool, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar vidas.")
			return
		}

		resp.LeagueTier, err = LoadLeagueTierName(r.Context(), pool, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar liga.")
			return
		}

		// IsVIP reflete o estado JÁ EXPIRADO (EhVIPAtivo), não a coluna crua is_vip — evita o
		// cliente achar que o VIP ainda vale só porque ninguém rodou um UPDATE zerando a flag.
		resp.IsVIP = EhVIPAtivo(isVipRaw, resp.VIPExpiresAt, time.Now().UTC())
		resp.XPBoostActive = XPBoostAtivo(resp.XPBoostActiveUntil, time.Now().UTC())

		rows, err := pool.Query(r.Context(), `SELECT type, unlocked_at FROM achievements WHERE user_id = $1 ORDER BY unlocked_at DESC`, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar conquistas.")
			return
		}
		defer rows.Close()
		resp.Achievements = []achievementJSON{}
		for rows.Next() {
			var a achievementJSON
			if err := rows.Scan(&a.Type, &a.UnlockedAt); err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao ler conquistas.")
				return
			}
			resp.Achievements = append(resp.Achievements, a)
		}

		resp.Cosmetics, err = LoadOwnedCosmetics(r.Context(), pool, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar cosméticos.")
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

// --- GET /v1/gamification/league ---

// defaultLeagueTier: usuário novo (sem user_gamification.current_tier ainda, caso defensivo —
// a coluna tem DEFAULT 1 desde a migration 0007) entra no rank 1 (Madeira, divisão 3 — a base da
// hierarquia).
const defaultLeagueTier = 1

// leagueTierNames: hierarquia de 10 ligas (pior -> melhor), cada uma com 3 divisões internas
// (3, 2, 1 — 3 é a entrada, 1 é a mais avançada dentro da liga). `current_tier`/`leagues.tier`
// no banco continuam guardando um único rank linear 1..30 (não duas colunas separadas) —
// rankTierName/rankDivision abaixo derivam liga+divisão a partir dele. rank 1 = Madeira 3 (base
// de tudo), rank 30 = Diamante 1 (topo).
var leagueTierNames = []string{
	"madeira", "pedra", "bronze", "prata", "ouro",
	"platina", "esmeralda", "safira", "rubi", "diamante",
}

const divisionsPerTier = 3
const minTier = 1

// maxTier não é const porque depende de len(leagueTierNames) — Go não permite const derivada de
// len() de uma var em tempo de compilação aqui (leagueTierNames podia em tese mudar de tamanho).
var maxTier = len(leagueTierNames) * divisionsPerTier // 30

// PromotionSlots/DemotionSlots: os 3 melhores de cada divisão avançam pra divisão seguinte
// (ou pra divisão 3 da próxima liga, se já estiver na divisão 1); os 3 piores caem pra divisão
// anterior. Exportados (via leagueResponse) pro frontend não precisar hardcodar esses números.
const PromotionSlots = 3
const DemotionSlots = 3

// tierName/rankDivision derivam o nome da liga e a divisão (3, 2 ou 1) a partir do rank linear
// 1..30 guardado no banco. rank 1 -> madeira/3, rank 2 -> madeira/2, rank 3 -> madeira/1, rank 4
// -> pedra/3, ..., rank 30 -> diamante/1.
func tierName(rank int) string {
	index := (rank - 1) / divisionsPerTier
	if index < 0 {
		index = 0
	}
	if index >= len(leagueTierNames) {
		index = len(leagueTierNames) - 1
	}
	return leagueTierNames[index]
}

func rankDivision(rank int) int {
	division := divisionsPerTier - ((rank - 1) % divisionsPerTier)
	if division < 1 {
		division = 1
	}
	if division > divisionsPerTier {
		division = divisionsPerTier
	}
	return division
}

// RankFromTierDivision expõe rankFromTierDivision pra fora do pacote — usado por
// cmd/seed-league-bots pra resolver user_gamification.current_tier a partir do nome da liga
// (ex.: "bronze") e da divisão (1, 2 ou 3) de cada jogador bot.
func RankFromTierDivision(tierNameArg string, division int) (int, bool) {
	return rankFromTierDivision(tierNameArg, division)
}

// rankFromTierDivision é o inverso de tierName/rankDivision — usado por GET
// .../league?tier=X&division=N pra navegar o ranking de uma liga/divisão específica.
func rankFromTierDivision(tierNameArg string, division int) (int, bool) {
	index := -1
	for i, name := range leagueTierNames {
		if name == tierNameArg {
			index = i
			break
		}
	}
	if index == -1 || division < 1 || division > divisionsPerTier {
		return 0, false
	}
	return index*divisionsPerTier + (divisionsPerTier - division) + 1, true
}

// mondayOf normaliza pra meia-noite UTC da segunda-feira da semana de `t` — usado como
// week_reference (mesma semana pra todo mundo, independente de quando cada um entrou).
func mondayOf(t time.Time) time.Time {
	t = t.UTC().Truncate(24 * time.Hour)
	offset := int(t.Weekday()) - int(time.Monday)
	if offset < 0 {
		offset += 7
	}
	return t.AddDate(0, 0, -offset)
}

// LoadLeagueTierName lê o nome da liga (ex.: "bronze") vigente do usuário nesta semana, ou nil se
// ele ainda não foi inserido em nenhuma (ver ensureLeagueMembership, chamado por GET /league —
// ninguém entra numa liga sozinho batendo só em GET /v1/users/me ou /v1/gamification/me, então
// fica nil até a pessoa abrir a tela Liga uma vez). Usado pelos dois endpoints que expõem
// league_tier (GET /v1/gamification/me e GET /v1/users/me) — única fonte de verdade pra não
// duplicar a query/lógica de tierName nos dois.
func LoadLeagueTierName(ctx context.Context, pool *pgxpool.Pool, userID string) (*string, error) {
	var tierNum *int
	if err := pool.QueryRow(ctx, `
		SELECT l.tier FROM league_members lm JOIN leagues l ON l.id = lm.league_id
		WHERE lm.user_id = $1 AND l.week_reference = $2
	`, userID, mondayOf(time.Now().UTC())).Scan(&tierNum); err != nil && err != pgx.ErrNoRows {
		return nil, err
	}
	if tierNum == nil {
		return nil, nil
	}
	name := tierName(*tierNum)
	return &name, nil
}

// ensureLeagueMembership garante que o usuário está numa leagues/league_members desta semana,
// criando os dois (upsert) se ainda não existir. A tier usada é user_gamification.current_tier —
// atualizada pelo fechamento semanal (CloseLeagueWeek, TDD §6) sempre que o usuário promove ou
// rebaixa; assim, a próxima vez que ele bater aqui (ex.: completando uma lição na semana nova),
// já cai direto na liga certa. Todo mundo cai no mesmo group_number=1 da sua tier por enquanto —
// particionar por grupo de <15 membros ativos (TDD §6 passo 1) não tem efeito real ainda, porque
// nunca existe mais de um grupo por tier/semana com esse hardcode (ver comentário em
// CloseLeagueWeek).
func ensureLeagueMembership(ctx context.Context, pool *pgxpool.Pool, userID string) (leagueID uuid.UUID, err error) {
	week := mondayOf(time.Now().UTC())

	tier := defaultLeagueTier
	if err = pool.QueryRow(ctx,
		`SELECT current_tier FROM user_gamification WHERE user_id = $1`, userID,
	).Scan(&tier); err != nil && err != pgx.ErrNoRows {
		return uuid.Nil, err
	}

	err = pool.QueryRow(ctx, `
		INSERT INTO leagues (id, week_reference, tier, group_number)
		VALUES ($1, $2, $3, 1)
		ON CONFLICT (week_reference, tier, group_number) DO UPDATE SET tier = leagues.tier
		RETURNING id
	`, uuid.New(), week, tier).Scan(&leagueID)
	if err != nil {
		return uuid.Nil, err
	}

	_, err = pool.Exec(ctx, `
		INSERT INTO league_members (league_id, user_id, xp_this_week)
		VALUES ($1, $2, 0)
		ON CONFLICT (league_id, user_id) DO NOTHING
	`, leagueID, userID)
	return leagueID, err
}

// AddWeeklyXP soma xp ao league_members.xp_this_week do usuário na liga da semana atual, criando
// a matrícula se ainda não existir (ensureLeagueMembership). Chamado por
// internal/learning/answers.go depois de conceder XP numa resposta — sem isso, a tela Liga nunca
// sairia de xp_this_week=0 pra ninguém, mesmo com a rota GET /league já sendo real.
func AddWeeklyXP(ctx context.Context, pool *pgxpool.Pool, userID string, xp int) error {
	if xp <= 0 {
		return nil
	}
	leagueID, err := ensureLeagueMembership(ctx, pool, userID)
	if err != nil {
		return err
	}
	_, err = pool.Exec(ctx,
		`UPDATE league_members SET xp_this_week = xp_this_week + $1 WHERE league_id = $2 AND user_id = $3`,
		xp, leagueID, userID)
	return err
}

// AdjustWeeklyXP soma um delta (positivo ou negativo) ao league_members.xp_this_week do usuário na
// liga da semana atual, criando a matrícula se ainda não existir (ensureLeagueMembership) — mesmo
// padrão de AddWeeklyXP, mas aceitando delta negativo. Usado por cmd/simulate-bot-activity pra
// oscilar o XP dos jogadores bot pra cima e pra baixo (a pedido do usuário, 20/08/2026); AddWeeklyXP
// continua intocada pro fluxo real de resposta correta, que só soma XP ganho de verdade. Nunca deixa
// xp_this_week ir abaixo de 0 (GREATEST no SQL) — XP negativo não faz sentido nem pra bot.
func AdjustWeeklyXP(ctx context.Context, pool *pgxpool.Pool, userID string, delta int) error {
	leagueID, err := ensureLeagueMembership(ctx, pool, userID)
	if err != nil {
		return err
	}
	_, err = pool.Exec(ctx,
		`UPDATE league_members SET xp_this_week = GREATEST(0, xp_this_week + $1) WHERE league_id = $2 AND user_id = $3`,
		delta, leagueID, userID)
	return err
}

type leagueRankingEntry struct {
	UserID     string `json:"user_id"`
	Name       string `json:"name"`
	XPThisWeek int    `json:"xp_this_week"`
	Position   int    `json:"position"`
}

// rankingTopN corta a resposta em até N posições — "top 50 de cada liga" pedido pro frontend;
// não limita o cálculo de promoção/rebaixamento abaixo, que precisa do ranking inteiro.
const rankingTopN = 50

type leagueResponse struct {
	LeagueID       string               `json:"league_id"`
	Tier           string               `json:"tier"`
	Division       int                  `json:"division"`
	WeekReference  string               `json:"week_reference"`
	Ranking        []leagueRankingEntry `json:"ranking"`
	PromotionSlots int                  `json:"promotion_slots"`
	DemotionSlots  int                  `json:"demotion_slots"`
	// ViewerPosition/XPToPromotion só vêm preenchidos quando a consulta é da liga do próprio
	// usuário autenticado (sem ?tier= na query, ou ?tier= igual à liga dele) — navegar por outra
	// liga (ex.: espiar o ranking de Diamante estando em Bronze) não faz sentido ter "quanto falta
	// pra subir" porque o usuário nem está competindo lá.
	ViewerPosition *int `json:"viewer_position,omitempty"`
	XPToPromotion  *int `json:"xp_to_promotion,omitempty"`
}

// queryLeagueRanking busca o ranking completo (sem corte de N) de uma liga já resolvida — usado
// tanto pra montar a resposta (que corta em rankingTopN) quanto pro cálculo de "quanto falta pra
// subir", que precisa enxergar além da 50ª posição se a liga for maior que isso.
func queryLeagueRanking(ctx context.Context, pool *pgxpool.Pool, leagueID uuid.UUID) ([]leagueRankingEntry, error) {
	rows, err := pool.Query(ctx, `
		SELECT lm.user_id, u.name, lm.xp_this_week
		FROM league_members lm JOIN users u ON u.id = lm.user_id
		WHERE lm.league_id = $1
		ORDER BY lm.xp_this_week DESC, u.name ASC
	`, leagueID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ranking []leagueRankingEntry
	position := 0
	for rows.Next() {
		position++
		var entry leagueRankingEntry
		if err := rows.Scan(&entry.UserID, &entry.Name, &entry.XPThisWeek); err != nil {
			return nil, err
		}
		entry.Position = position
		ranking = append(ranking, entry)
	}
	return ranking, rows.Err()
}

func handleGetLeague(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		// ?tier=ouro&division=2: navegar o ranking de outra liga/divisão (pra tela "top 50 de cada
		// liga") em vez da liga do próprio usuário — não chama ensureLeagueMembership (o usuário
		// não está necessariamente matriculado nela), só lê o que já existir pra semana corrente.
		// division é opcional, default 1 (a divisão mais avançada daquela liga).
		if tierParam := r.URL.Query().Get("tier"); tierParam != "" {
			division := 1
			if divisionParam := r.URL.Query().Get("division"); divisionParam != "" {
				parsed, err := strconv.Atoi(divisionParam)
				if err != nil {
					apierror.Write(w, http.StatusBadRequest, "INVALID_DIVISION", "Divisão inválida — use 1, 2 ou 3.")
					return
				}
				division = parsed
			}
			rank, ok := rankFromTierDivision(tierParam, division)
			if !ok {
				apierror.Write(w, http.StatusBadRequest, "INVALID_TIER", "Liga/divisão inválida — use madeira, pedra, bronze, prata, ouro, platina, esmeralda, safira, rubi ou diamante, com divisão 1, 2 ou 3.")
				return
			}
			week := mondayOf(time.Now().UTC())

			var leagueID uuid.UUID
			var weekRef time.Time
			err := pool.QueryRow(r.Context(), `
				SELECT id, week_reference FROM leagues WHERE week_reference = $1 AND tier = $2 AND group_number = 1
			`, week, rank).Scan(&leagueID, &weekRef)
			if err == pgx.ErrNoRows {
				// Ninguém está nessa liga/divisão ainda esta semana — resposta válida e vazia, não é erro.
				writeJSON(w, http.StatusOK, leagueResponse{
					Tier: tierName(rank), Division: rankDivision(rank), WeekReference: week.Format("2006-01-02"),
					Ranking: []leagueRankingEntry{}, PromotionSlots: PromotionSlots, DemotionSlots: DemotionSlots,
				})
				return
			}
			if err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar liga.")
				return
			}

			ranking, err := queryLeagueRanking(r.Context(), pool, leagueID)
			if err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar ranking.")
				return
			}
			resp := leagueResponse{
				LeagueID: leagueID.String(), Tier: tierName(rank), Division: rankDivision(rank),
				WeekReference: weekRef.Format("2006-01-02"),
				Ranking:       capRanking(ranking, rankingTopN), PromotionSlots: PromotionSlots, DemotionSlots: DemotionSlots,
			}
			writeJSON(w, http.StatusOK, resp)
			return
		}

		leagueID, err := ensureLeagueMembership(r.Context(), pool, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao entrar na liga.")
			return
		}

		var resp leagueResponse
		var weekRef time.Time
		var tierNum int
		if err := pool.QueryRow(r.Context(),
			`SELECT id, tier, week_reference FROM leagues WHERE id = $1`, leagueID,
		).Scan(&leagueID, &tierNum, &weekRef); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar liga.")
			return
		}
		resp.LeagueID = leagueID.String()
		resp.Tier = tierName(tierNum)
		resp.Division = rankDivision(tierNum)
		resp.WeekReference = weekRef.Format("2006-01-02")
		resp.PromotionSlots = PromotionSlots
		resp.DemotionSlots = DemotionSlots

		ranking, err := queryLeagueRanking(r.Context(), pool, leagueID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar ranking.")
			return
		}
		resp.Ranking = capRanking(ranking, rankingTopN)

		// "Quanto falta pra subir": distância de XP até o último lugar da zona de promoção (TDD
		// §6, top N=PromotionSlots), calculada em cima do ranking real da semana em curso — não
		// depende do fechamento semanal já ter rodado, é só uma projeção do resultado se a semana
		// fechasse agora. Só mostra a projeção quando o grupo já tem gente suficiente pra uma
		// promoção de verdade acontecer no fechamento (mesmo limiar de CloseLeagueWeek,
		// minGroupSizeForPromotion) — senão a mensagem prometeria uma subida que o fechamento
		// real não vai conceder essa semana.
		for _, entry := range ranking {
			if entry.UserID != userID {
				continue
			}
			pos := entry.Position
			resp.ViewerPosition = &pos
			if len(ranking) >= minGroupSizeForPromotion && pos > PromotionSlots && tierNum < maxTier {
				cutoffXP := ranking[PromotionSlots-1].XPThisWeek
				faltam := cutoffXP - entry.XPThisWeek + 1
				if faltam < 0 {
					faltam = 0
				}
				resp.XPToPromotion = &faltam
			} else {
				zero := 0
				resp.XPToPromotion = &zero
			}
			break
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

func capRanking(ranking []leagueRankingEntry, n int) []leagueRankingEntry {
	if ranking == nil {
		return []leagueRankingEntry{}
	}
	if len(ranking) > n {
		return ranking[:n]
	}
	return ranking
}

// --- Fechamento semanal de ligas (TDD §6) ---

// minGroupSizeForPromotion: com PromotionSlots=3 e DemotionSlots=3, uma divisão com pelo menos 6
// membros já não tem sobreposição entre "top 3" e "bottom 3" — esse é o mínimo matemático, sem
// buffer extra. O TDD §6 original desenhava zonas em cima de grupos de ~30 membros (5 tiers
// largos); aqui são 30 divisões estreitas (10 ligas x 3 divisões), então grupos naturalmente bem
// menores são esperados e aceitáveis — não faz sentido reaplicar aquele buffer de "~30 membros"
// a um formato desenhado pra ter grupos pequenos por design. Abaixo desse mínimo, ninguém promove
// nem rebaixa naquela divisão nesta semana.
const minGroupSizeForPromotion = PromotionSlots + DemotionSlots

// CloseLeagueWeek executa o fechamento semanal (TDD §6, adaptado pra hierarquia de 10 ligas x 3
// divisões — ver leagueTierNames) da `week` informada: pra cada liga/divisão daquela semana,
// ordena o ranking por xp_this_week, promove os PromotionSlots melhores, rebaixa os
// DemotionSlots piores, e persiste o novo rank (1..30) em user_gamification.current_tier — é
// esse valor que ensureLeagueMembership lê pra decidir em qual liga/divisão colocar o usuário na
// semana seguinte. Idempotente: rodar duas vezes pra mesma semana repete o mesmo cálculo em cima
// do ranking (que não muda depois que a semana vira passado) e grava o mesmo resultado.
//
// Direção do rank: 1 = Madeira 3 (base) .. 30 = Diamante 1 (topo) — promoção move rank+1, rumo ao
// topo; rebaixamento move rank-1, rumo à base. Isso empurra o usuário pela divisão seguinte da
// mesma liga (ex.: Madeira 3 -> Madeira 2) e só troca de liga ao cruzar a fronteira da divisão 1
// (ex.: Madeira 1 -> Pedra 3), exatamente como tierName/rankDivision derivam liga+divisão do rank.
//
// Passo 1 do TDD (mesclar grupos com <15 membros ativos no group_number adjacente) não está
// implementado: ensureLeagueMembership sempre usa group_number=1, então nunca existe mais de um
// grupo por liga/divisão/semana com o código atual — não há nada real pra mesclar ainda.
//
// Passo 5 do TDD (emitir league.week_closed no barramento de eventos) também não está implementado
// — nenhum consumidor existe ainda (mesmo estágio dos outros eventos deste pacote, ver
// AddWeeklyXP); adicionar quando o Notifications/Analytics Service passar a consumir de verdade.
func CloseLeagueWeek(ctx context.Context, pool *pgxpool.Pool, week time.Time) error {
	week = mondayOf(week)

	rows, err := pool.Query(ctx, `SELECT id, tier FROM leagues WHERE week_reference = $1`, week)
	if err != nil {
		return err
	}
	type leagueRow struct {
		id   uuid.UUID
		tier int
	}
	var leagues []leagueRow
	for rows.Next() {
		var l leagueRow
		if err := rows.Scan(&l.id, &l.tier); err != nil {
			rows.Close()
			return err
		}
		leagues = append(leagues, l)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}

	for _, l := range leagues {
		ranking, err := queryLeagueRanking(ctx, pool, l.id)
		if err != nil {
			return err
		}
		n := len(ranking)
		if n < minGroupSizeForPromotion {
			log.Printf("liga %s (tier=%d, semana=%s): %d membros, abaixo do mínimo de %d pra promoção/rebaixamento — ninguém muda de tier",
				l.id, l.tier, week.Format("2006-01-02"), n, minGroupSizeForPromotion)
			continue
		}

		for _, entry := range ranking {
			newTier := l.tier
			switch {
			case entry.Position <= PromotionSlots && l.tier < maxTier:
				newTier = l.tier + 1
			case entry.Position > n-DemotionSlots && l.tier > minTier:
				newTier = l.tier - 1
			}
			if newTier == l.tier {
				continue
			}
			if _, err := pool.Exec(ctx,
				`UPDATE user_gamification SET current_tier = $1 WHERE user_id = $2`,
				newTier, entry.UserID,
			); err != nil {
				return err
			}
		}
	}

	return nil
}

// --- POST /v1/gamification/streak/freeze ---

type freezeResponse struct {
	StreakFreezesAvailable int `json:"streak_freezes_available"`
}

// handleStreakFreeze consome um bloqueio de ofensiva sob ação explícita do usuário (botão "Usar
// Bloqueio Agora" do StreakDialog, inclusive o prompt automático de streak em risco — ver
// StreakEmRisco). Diferente da expiração automática (AplicarExpiracaoStreak, que NÃO avança
// streak_last_active_date de propósito, TDD §5.3), aqui é uma proteção proativa: marca o dia de
// hoje como coberto (streak_last_active_date = hojeLocal) mesmo que o usuário não pratique — é
// isso que faz "usar agora" realmente evitar a perda do dia, em vez de só descontar o contador
// sem efeito nenhum.
func handleStreakFreeze(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		var timezone string
		if err := pool.QueryRow(r.Context(),
			`SELECT timezone FROM users WHERE id = $1`, userID,
		).Scan(&timezone); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar perfil.")
			return
		}
		hojeLocalDate, err := time.Parse("2006-01-02", HojeLocal(timezone, time.Now()))
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao calcular data local.")
			return
		}

		var remaining int
		err = pool.QueryRow(r.Context(), `
			UPDATE user_gamification
			SET streak_freezes_available = streak_freezes_available - 1, streak_last_active_date = $2
			WHERE user_id = $1 AND streak_freezes_available > 0
			RETURNING streak_freezes_available
		`, userID, hojeLocalDate).Scan(&remaining)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusConflict, "NO_STREAK_FREEZE_AVAILABLE", "Você não tem nenhum bloqueio de ofensiva disponível.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consumir bloqueio de ofensiva.")
			return
		}

		writeJSON(w, http.StatusOK, freezeResponse{StreakFreezesAvailable: remaining})
	}
}

// --- POST /v1/gamification/shop/purchase ---

type purchaseRequest struct {
	ItemID string `json:"item_id"`
}

type purchaseResponse struct {
	GemsRestantes int `json:"gems_restantes"`
	Item          struct {
		ID   string `json:"id"`
		Tipo string `json:"tipo"`
	} `json:"item"`
}

func handleShopPurchase(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}
		idempotencyKey := r.Header.Get("Idempotency-Key")
		if idempotencyKey == "" {
			apierror.Write(w, http.StatusBadRequest, "IDEMPOTENCY_KEY_REQUIRED", "Cabeçalho Idempotency-Key obrigatório.")
			return
		}

		var req purchaseRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ItemID == "" {
			apierror.Write(w, http.StatusBadRequest, "INVALID_BODY", "Corpo da requisição inválido.")
			return
		}

		// Idempotência de verdade: se essa chave já foi usada, devolve o mesmo resultado em vez
		// de tentar cobrar de novo (purchases.idempotency_key é UNIQUE, ver migrations/0001_init).
		var existing purchaseResponse
		var existingGems int
		err := pool.QueryRow(r.Context(), `
			SELECT p.price_paid_gems, si.id, si.category,
			       (SELECT gems FROM user_gamification WHERE user_id = $2)
			FROM purchases p JOIN shop_items si ON si.id = p.item_id
			WHERE p.idempotency_key = $1
		`, idempotencyKey, userID).Scan(new(int), &existing.Item.ID, &existing.Item.Tipo, &existingGems)
		if err == nil {
			existing.GemsRestantes = existingGems
			writeJSON(w, http.StatusOK, existing)
			return
		}
		if err != pgx.ErrNoRows {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao verificar compra.")
			return
		}

		var itemUUID uuid.UUID
		if itemUUID, err = uuid.Parse(req.ItemID); err != nil {
			apierror.Write(w, http.StatusNotFound, "ITEM_NOT_FOUND", "Item não encontrado na loja.")
			return
		}

		var priceGems int
		var category string
		err = pool.QueryRow(r.Context(),
			`SELECT price_gems, category FROM shop_items WHERE id = $1 AND active = true`, itemUUID,
		).Scan(&priceGems, &category)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusNotFound, "ITEM_NOT_FOUND", "Item não encontrado na loja.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar item.")
			return
		}

		// Teto de bloqueios de ofensiva (RS-03, TDD §5.5) — checado ANTES de debitar gemas: sem
		// isso, o usuário pagaria por um freeze que não seria creditado.
		if category == "streak_freeze" {
			var streakFreezesAvailable, streakBest int
			if err := pool.QueryRow(r.Context(),
				`SELECT streak_freezes_available, streak_best FROM user_gamification WHERE user_id = $1`, userID,
			).Scan(&streakFreezesAvailable, &streakBest); err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar perfil.")
				return
			}
			if streakFreezesAvailable >= CapDeFreezes(streakBest) {
				apierror.Write(w, http.StatusConflict, "STREAK_FREEZE_CAP_REACHED", "Você já está no teto de bloqueios de ofensiva.")
				return
			}
		}

		tx, err := pool.Begin(r.Context())
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao iniciar compra.")
			return
		}
		defer func() { _ = tx.Rollback(r.Context()) }()

		var gemsRestantes int
		err = tx.QueryRow(r.Context(), `
			UPDATE user_gamification SET gems = gems - $1 WHERE user_id = $2 AND gems >= $1
			RETURNING gems
		`, priceGems, userID).Scan(&gemsRestantes)
		if err == pgx.ErrNoRows {
			apierror.Write(w, http.StatusPaymentRequired, "INSUFFICIENT_GEMS", "Gemas insuficientes para esta compra.")
			return
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao debitar gemas.")
			return
		}

		// Efeito de posse imediata: consumíveis mexem em user_gamification; cosméticos entram no
		// inventário (user_cosmetics, migration 0015) já equipados — sem tela de "trocar
		// equipado" ainda, então comprar = usar. ON CONFLICT DO NOTHING porque recomprar um
		// cosmético já possuído (idempotência à parte, alguém pode clicar duas vezes rápido) não
		// deve duplicar linha nem re-equipar o que já estava.
		if category == "cosmetic" {
			if _, err := tx.Exec(r.Context(),
				`INSERT INTO user_cosmetics (user_id, item_id) VALUES ($1, $2) ON CONFLICT (user_id, item_id) DO NOTHING`,
				userID, itemUUID); err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao aplicar item.")
				return
			}
		}
		if category == "streak_freeze" {
			// Re-checa o teto dentro da própria transação (defesa contra corrida entre a checagem
			// acima e este UPDATE — duas compras quase simultâneas) — 0 linhas afetadas aqui, com
			// o Rollback deferido, desfaz também o débito de gemas já feito acima nesta mesma tx.
			var streakBest int
			if err := tx.QueryRow(r.Context(),
				`SELECT streak_best FROM user_gamification WHERE user_id = $1`, userID,
			).Scan(&streakBest); err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar perfil.")
				return
			}
			tag, err := tx.Exec(r.Context(),
				`UPDATE user_gamification SET streak_freezes_available = streak_freezes_available + 1
				 WHERE user_id = $1 AND streak_freezes_available < $2`,
				userID, CapDeFreezes(streakBest))
			if err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao aplicar item.")
				return
			}
			if tag.RowsAffected() == 0 {
				apierror.Write(w, http.StatusConflict, "STREAK_FREEZE_CAP_REACHED", "Você já está no teto de bloqueios de ofensiva.")
				return
			}
		}
		if category == "hearts_refill" {
			// hearts_updated_at = agora: equivalente a já estar cheio (RegenerarVidas nem olha
			// pro timestamp quando hearts_current >= HeartsMax), mas evita deixar um timestamp
			// arbitrariamente antigo gravado — se uma vida for perdida logo em seguida, o
			// relógio de regeneração começa limpo a partir da compra, não de antes dela.
			if _, err := tx.Exec(r.Context(),
				`UPDATE user_gamification SET hearts_current = $1, hearts_updated_at = now() WHERE user_id = $2`,
				HeartsMax, userID); err != nil {
				apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao aplicar item.")
				return
			}
		}

		if _, err := tx.Exec(r.Context(), `
			INSERT INTO purchases (id, user_id, item_id, price_paid_gems, idempotency_key)
			VALUES ($1, $2, $3, $4, $5)
		`, uuid.New(), userID, itemUUID, priceGems, idempotencyKey); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao registrar compra.")
			return
		}

		// Contadores de conquista somados dentro da mesma transação (atômico com o débito de
		// gemas acima) — só avaliados/gravados como achievement depois do commit confirmado.
		counters, err := scanCounters(tx.QueryRow(r.Context(), `
			UPDATE user_gamification SET
				shop_purchases_total = shop_purchases_total + 1,
				gems_spent_total = gems_spent_total + $2
			WHERE user_id = $1
			RETURNING `+counterColumns, userID, priceGems))
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao atualizar contadores.")
			return
		}

		if err := tx.Commit(r.Context()); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao concluir compra.")
			return
		}

		// Best-effort, mesmo padrão de AddWeeklyXP — a compra já está confirmada acima.
		if _, err := EvaluateAndUnlock(r.Context(), pool, userID, counters); err != nil {
			log.Printf("aviso: falha ao avaliar conquistas (user_id=%s): %v", userID, err)
		}

		resp := purchaseResponse{GemsRestantes: gemsRestantes}
		resp.Item.ID = itemUUID.String()
		resp.Item.Tipo = category
		writeJSON(w, http.StatusOK, resp)
	}
}

// AwardGems credita gems ao usuário (não é uma compra — não debita nada de ninguém). Usado hoje só
// pelo pacote bugreports (POST /v1/bug-reports/{id}/resolve, API Spec §14): gemas de agradecimento
// a quem reportou um bug/sugestão marcado como corrigido/implementada. Aplica VIPGemsMultiplier
// internamente (a pedido do usuário, 19/08/2026) — devolve o valor REALMENTE creditado (dobrado
// se VIP), não o `amount` pedido, pra quem chama poder mostrar o número certo ao usuário.
func AwardGems(ctx context.Context, pool *pgxpool.Pool, userID string, amount int) (awarded int, newTotal int, err error) {
	var isVip bool
	var vipExpiresAt *time.Time
	if err = pool.QueryRow(ctx,
		`SELECT is_vip, vip_expires_at FROM user_gamification WHERE user_id = $1`, userID,
	).Scan(&isVip, &vipExpiresAt); err != nil {
		return 0, 0, err
	}
	awarded = amount
	if EhVIPAtivo(isVip, vipExpiresAt, time.Now().UTC()) {
		awarded *= VIPGemsMultiplier
	}
	err = pool.QueryRow(ctx,
		`UPDATE user_gamification SET gems = gems + $1 WHERE user_id = $2 RETURNING gems`,
		awarded, userID,
	).Scan(&newTotal)
	return awarded, newTotal, err
}

// --- Baú Diário (a pedido do usuário) ---

// DailyChestSnapshot é o retorno de LoadDailyChestStatus.
type DailyChestSnapshot struct {
	QuestionsToday    int
	QuestionsRequired int
	Available         bool
	ClaimedToday      bool
}

// LoadDailyChestStatus lê chest_questions_today/chest_questions_date e chest_claimed_date, aplica
// o reset preguiçoso do contador (mesmo padrão de LoadHeartsWithRegen/LoadStreakWithExpiration —
// sem job/cron nesta fase bootstrap) e devolve se o Baú Diário está disponível pra abrir agora.
// Chamada por GET /v1/gamification/daily-chest e por POST .../answers e .../infinite-mode/.../
// answers (internal/learning) antes de incrementar a resposta atual no contador.
func LoadDailyChestStatus(ctx context.Context, pool *pgxpool.Pool, userID string) (DailyChestSnapshot, error) {
	var questionsToday int
	var questionsDate, claimedDate *time.Time
	var timezone string
	if err := pool.QueryRow(ctx, `
		SELECT g.chest_questions_today, g.chest_questions_date, g.chest_claimed_date, u.timezone
		FROM user_gamification g JOIN users u ON u.id = g.user_id
		WHERE g.user_id = $1
	`, userID).Scan(&questionsToday, &questionsDate, &claimedDate, &timezone); err != nil {
		return DailyChestSnapshot{}, err
	}

	hojeLocal := HojeLocal(timezone, time.Now())
	questionsDateStr := ""
	if questionsDate != nil {
		questionsDateStr = questionsDate.Format("2006-01-02")
	}
	novoQuestoes := QuestoesHojeAposReset(questionsToday, questionsDateStr, hojeLocal)
	if novoQuestoes != questionsToday {
		if _, err := pool.Exec(ctx,
			`UPDATE user_gamification SET chest_questions_today = $1 WHERE user_id = $2`,
			novoQuestoes, userID,
		); err != nil {
			return DailyChestSnapshot{}, err
		}
		questionsToday = novoQuestoes
	}

	claimedDateStr := ""
	if claimedDate != nil {
		claimedDateStr = claimedDate.Format("2006-01-02")
	}
	claimedToday := claimedDateStr == hojeLocal

	return DailyChestSnapshot{
		QuestionsToday:    questionsToday,
		QuestionsRequired: ChestQuestionsRequired,
		Available:         questionsToday >= ChestQuestionsRequired && !claimedToday,
		ClaimedToday:      claimedToday,
	}, nil
}

func handleGetDailyChestStatus(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}
		status, err := LoadDailyChestStatus(r.Context(), pool, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar baú diário.")
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"questions_today":    status.QuestionsToday,
			"questions_required": status.QuestionsRequired,
			"available":          status.Available,
			"claimed_today":      status.ClaimedToday,
		})
	}
}

// handleOpenDailyChest implementa POST /v1/gamification/daily-chest/open — sorteia a recompensa
// (RolarRecompensaBau), aplica o efeito (gemas, ou credita o item consumível de graça, mesmos
// efeitos de handleShopPurchase mas sem debitar nada) e marca chest_claimed_date = hoje, tudo
// numa transação. 409 CHEST_NOT_AVAILABLE se ainda não bateu as 10 perguntas do dia ou já foi
// aberto hoje — reconsulta o status fresco em vez de confiar em algo que o cliente mandou.
func handleOpenDailyChest(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		status, err := LoadDailyChestStatus(r.Context(), pool, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar baú diário.")
			return
		}
		if !status.Available {
			apierror.Write(w, http.StatusConflict, "CHEST_NOT_AVAILABLE", "Nenhum Baú Diário disponível pra abrir agora.")
			return
		}

		var timezone string
		if err := pool.QueryRow(r.Context(), `SELECT timezone FROM users WHERE id = $1`, userID).Scan(&timezone); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar usuário.")
			return
		}
		hojeLocal := HojeLocal(timezone, time.Now())
		hojeLocalDate, _ := time.Parse("2006-01-02", hojeLocal)

		var isVip bool
		var vipExpiresAt *time.Time
		var streakBest int
		var xpBoostActiveUntil *time.Time
		if err := pool.QueryRow(r.Context(),
			`SELECT is_vip, vip_expires_at, streak_best, xp_boost_active_until FROM user_gamification WHERE user_id = $1`, userID,
		).Scan(&isVip, &vipExpiresAt, &streakBest, &xpBoostActiveUntil); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar perfil VIP.")
			return
		}
		vipAtivo := EhVIPAtivo(isVip, vipExpiresAt, time.Now().UTC())
		freezeCap := CapDeFreezes(streakBest)

		reward := RolarRecompensaBau(rand.Float64(), rand.Float64())
		// VIPGemsMultiplier (a pedido do usuário, 19/08/2026): dobra gemas do Baú Diário pra VIP.
		if vipAtivo && reward.Type == ChestRewardGems {
			reward.GemsAmount *= VIPGemsMultiplier
		}

		tx, err := pool.Begin(r.Context())
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao abrir baú.")
			return
		}
		defer func() { _ = tx.Rollback(r.Context()) }()

		var newGems int
		var newXPBoostActiveUntil time.Time
		switch reward.Type {
		case ChestRewardGems:
			err = tx.QueryRow(r.Context(),
				`UPDATE user_gamification SET gems = gems + $1, chest_claimed_date = $2 WHERE user_id = $3 RETURNING gems`,
				reward.GemsAmount, hojeLocalDate, userID,
			).Scan(&newGems)
		case ChestRewardStreakFreeze:
			// Respeita o teto RS-03: se já está no teto, o baú credita 0 (recompensa "some" — sem
			// substituição por outra recompensa, decisão deliberada, ver TDD §5.5), nunca reduz
			// quem já tinha mais freezes que o teto atual (CASE WHEN, não LEAST).
			err = tx.QueryRow(r.Context(), `
				UPDATE user_gamification SET
				  streak_freezes_available = CASE WHEN streak_freezes_available < $1 THEN streak_freezes_available + 1 ELSE streak_freezes_available END,
				  chest_claimed_date = $2
				WHERE user_id = $3 RETURNING gems`,
				freezeCap, hojeLocalDate, userID,
			).Scan(&newGems)
		case ChestRewardHeartsRefill:
			// hearts_updated_at = agora, mesmo raciocínio de handleShopPurchase (equivalente a já
			// estar cheio, sem deixar timestamp arbitrariamente antigo gravado).
			err = tx.QueryRow(r.Context(),
				`UPDATE user_gamification SET hearts_current = $1, hearts_updated_at = now(), chest_claimed_date = $2 WHERE user_id = $3 RETURNING gems`,
				HeartsMax, hojeLocalDate, userID,
			).Scan(&newGems)
		case ChestRewardXPBoost:
			// AtivarXPBoost empilha em vez de sobrescrever (TDD §3.3) — ver algorithms.go.
			newXPBoostActiveUntil = AtivarXPBoost(xpBoostActiveUntil, time.Now().UTC())
			err = tx.QueryRow(r.Context(),
				`UPDATE user_gamification SET xp_boost_active_until = $1, chest_claimed_date = $2 WHERE user_id = $3 RETURNING gems`,
				newXPBoostActiveUntil, hojeLocalDate, userID,
			).Scan(&newGems)
		default:
			err = fmt.Errorf("tipo de recompensa de baú desconhecido: %q", reward.Type)
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao aplicar recompensa do baú.")
			return
		}

		if err := tx.Commit(r.Context()); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao concluir abertura do baú.")
			return
		}

		resp := map[string]any{
			"reward_type": string(reward.Type),
			"gems":        newGems,
		}
		if reward.Type == ChestRewardGems {
			resp["gems_earned"] = reward.GemsAmount
		}
		if reward.Type == ChestRewardXPBoost {
			resp["xp_boost_active_until"] = newXPBoostActiveUntil
		}
		writeJSON(w, http.StatusOK, resp)
	}
}

// --- Baú Semanal (a pedido do usuário, mesma demanda do Baú Diário) ---

// WeeklyChestSnapshot é o retorno de LoadWeeklyChestStatus.
type WeeklyChestSnapshot struct {
	QuestionsThisCycle int
	QuestionsRequired  int
	Available          bool
	ClaimedThisCycle   bool
}

// LoadWeeklyChestStatus lê chest_weekly_questions/chest_weekly_cycle_start e
// chest_weekly_claimed_cycle_start, aplica o reset preguiçoso do ciclo de 7 dias
// (QuestoesSemanaAposReset) e devolve se o Baú Semanal está disponível pra abrir agora. Mesmo
// padrão de LoadDailyChestStatus, mas comparando o cycle_start vigente com o cycle_start salvo no
// momento da última abertura em vez de igualdade de data — isso sozinho já "desclaima" o baú
// quando o ciclo vira, sem precisar zerar chest_weekly_claimed_cycle_start em lugar nenhum.
func LoadWeeklyChestStatus(ctx context.Context, pool *pgxpool.Pool, userID string) (WeeklyChestSnapshot, error) {
	var questionsThisCycle int
	var cycleStart, claimedCycleStart *time.Time
	var timezone string
	if err := pool.QueryRow(ctx, `
		SELECT g.chest_weekly_questions, g.chest_weekly_cycle_start, g.chest_weekly_claimed_cycle_start, u.timezone
		FROM user_gamification g JOIN users u ON u.id = g.user_id
		WHERE g.user_id = $1
	`, userID).Scan(&questionsThisCycle, &cycleStart, &claimedCycleStart, &timezone); err != nil {
		return WeeklyChestSnapshot{}, err
	}

	hojeLocal := HojeLocal(timezone, time.Now())
	cycleStartStr := ""
	if cycleStart != nil {
		cycleStartStr = cycleStart.Format("2006-01-02")
	}
	novoQuestoes, novoCicloInicio := QuestoesSemanaAposReset(questionsThisCycle, cycleStartStr, hojeLocal)
	if novoQuestoes != questionsThisCycle || novoCicloInicio != cycleStartStr {
		novoCicloInicioDate, _ := time.Parse("2006-01-02", novoCicloInicio)
		if _, err := pool.Exec(ctx,
			`UPDATE user_gamification SET chest_weekly_questions = $1, chest_weekly_cycle_start = $2 WHERE user_id = $3`,
			novoQuestoes, novoCicloInicioDate, userID,
		); err != nil {
			return WeeklyChestSnapshot{}, err
		}
		questionsThisCycle = novoQuestoes
		cycleStartStr = novoCicloInicio
	}

	claimedCycleStartStr := ""
	if claimedCycleStart != nil {
		claimedCycleStartStr = claimedCycleStart.Format("2006-01-02")
	}
	claimedThisCycle := claimedCycleStartStr != "" && claimedCycleStartStr == cycleStartStr

	return WeeklyChestSnapshot{
		QuestionsThisCycle: questionsThisCycle,
		QuestionsRequired:  ChestWeeklyQuestionsRequired,
		Available:          questionsThisCycle >= ChestWeeklyQuestionsRequired && !claimedThisCycle,
		ClaimedThisCycle:   claimedThisCycle,
	}, nil
}

func handleGetWeeklyChestStatus(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}
		status, err := LoadWeeklyChestStatus(r.Context(), pool, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar baú semanal.")
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"questions_this_cycle": status.QuestionsThisCycle,
			"questions_required":   status.QuestionsRequired,
			"available":            status.Available,
			"claimed_this_cycle":   status.ClaimedThisCycle,
		})
	}
}

// handleOpenWeeklyChest implementa POST /v1/gamification/weekly-chest/open — mesmo padrão de
// handleOpenDailyChest, mas sorteando com RolarRecompensaBauSemanal (recompensa maior) e gravando
// chest_weekly_claimed_cycle_start = cycle_start vigente (não "hoje") — é essa comparação que trava
// reabertura dentro do mesmo ciclo de 7 dias, mesmo que o usuário abra no primeiro dia do ciclo.
func handleOpenWeeklyChest(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := authmiddleware.UserID(r.Context())
		if !ok {
			apierror.Write(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Token inválido.")
			return
		}

		status, err := LoadWeeklyChestStatus(r.Context(), pool, userID)
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar baú semanal.")
			return
		}
		if !status.Available {
			apierror.Write(w, http.StatusConflict, "CHEST_NOT_AVAILABLE", "Nenhum Baú Semanal disponível pra abrir agora.")
			return
		}

		var cycleStart *time.Time
		var isVip bool
		var vipExpiresAt *time.Time
		var streakBest int
		var xpBoostActiveUntil *time.Time
		if err := pool.QueryRow(r.Context(),
			`SELECT chest_weekly_cycle_start, is_vip, vip_expires_at, streak_best, xp_boost_active_until FROM user_gamification WHERE user_id = $1`, userID,
		).Scan(&cycleStart, &isVip, &vipExpiresAt, &streakBest, &xpBoostActiveUntil); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao consultar ciclo semanal.")
			return
		}
		if cycleStart == nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Ciclo semanal inconsistente.")
			return
		}
		freezeCap := CapDeFreezes(streakBest)

		reward := RolarRecompensaBauSemanal(rand.Float64(), rand.Float64())
		// Benefício VIP (a pedido do usuário): Baú Semanal do VIP não é sorteado — vem sempre com
		// Bloqueio de Ofensiva garantido. RolarRecompensaBauSemanal continua pura/testável; o
		// override fica só aqui, no ponto de uso.
		if EhVIPAtivo(isVip, vipExpiresAt, time.Now().UTC()) {
			reward = ChestReward{Type: ChestRewardStreakFreeze}
		}

		tx, err := pool.Begin(r.Context())
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao abrir baú.")
			return
		}
		defer func() { _ = tx.Rollback(r.Context()) }()

		var newGems int
		var newXPBoostActiveUntil time.Time
		switch reward.Type {
		case ChestRewardGems:
			err = tx.QueryRow(r.Context(),
				`UPDATE user_gamification SET gems = gems + $1, chest_weekly_claimed_cycle_start = $2 WHERE user_id = $3 RETURNING gems`,
				reward.GemsAmount, cycleStart, userID,
			).Scan(&newGems)
		case ChestRewardStreakFreeze:
			// Mesmo raciocínio do baú diário: respeita o teto RS-03 sem confiscar quem já tinha
			// mais freezes que o teto atual (CASE WHEN, não LEAST). Pro VIP com recompensa
			// garantida (acima), no teto isso vira um no-op silencioso — documentado no TDD §5.5,
			// não corrigido com substituição de recompensa (fora de proporção pra esta entrega).
			err = tx.QueryRow(r.Context(), `
				UPDATE user_gamification SET
				  streak_freezes_available = CASE WHEN streak_freezes_available < $1 THEN streak_freezes_available + 1 ELSE streak_freezes_available END,
				  chest_weekly_claimed_cycle_start = $2
				WHERE user_id = $3 RETURNING gems`,
				freezeCap, cycleStart, userID,
			).Scan(&newGems)
		case ChestRewardHeartsRefill:
			err = tx.QueryRow(r.Context(),
				`UPDATE user_gamification SET hearts_current = $1, hearts_updated_at = now(), chest_weekly_claimed_cycle_start = $2 WHERE user_id = $3 RETURNING gems`,
				HeartsMax, cycleStart, userID,
			).Scan(&newGems)
		case ChestRewardXPBoost:
			// AtivarXPBoost empilha em vez de sobrescrever (TDD §3.3) — ver algorithms.go. Não
			// alcançável quando VIP está ativo (override acima já força ChestRewardStreakFreeze).
			newXPBoostActiveUntil = AtivarXPBoost(xpBoostActiveUntil, time.Now().UTC())
			err = tx.QueryRow(r.Context(),
				`UPDATE user_gamification SET xp_boost_active_until = $1, chest_weekly_claimed_cycle_start = $2 WHERE user_id = $3 RETURNING gems`,
				newXPBoostActiveUntil, cycleStart, userID,
			).Scan(&newGems)
		default:
			err = fmt.Errorf("tipo de recompensa de baú desconhecido: %q", reward.Type)
		}
		if err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao aplicar recompensa do baú.")
			return
		}

		if err := tx.Commit(r.Context()); err != nil {
			apierror.Write(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Falha ao concluir abertura do baú.")
			return
		}

		resp := map[string]any{
			"reward_type": string(reward.Type),
			"gems":        newGems,
		}
		if reward.Type == ChestRewardGems {
			resp["gems_earned"] = reward.GemsAmount
		}
		if reward.Type == ChestRewardXPBoost {
			resp["xp_boost_active_until"] = newXPBoostActiveUntil
		}
		writeJSON(w, http.StatusOK, resp)
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
