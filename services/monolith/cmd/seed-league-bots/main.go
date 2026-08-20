// Command seed-league-bots cria jogadores bot pra popular ligas com poucos usuários reais (baixa
// competitividade, pedido do usuário 20/08/2026) — 20 bots por liga (10 ligas x 20 = 200),
// espalhados pelas 3 divisões de cada liga. Reaproveita gamification.AddWeeklyXP (a mesma função
// usada pelo fluxo real de resposta correta, internal/learning/answers.go) pra criar a matrícula
// da semana corrente e já gravar um xp_this_week inicial, em vez de reimplementar
// ensureLeagueMembership aqui.
//
// Bot não tem conta no Supabase Auth — depende da migration 0014_bot_players (users.is_bot,
// FK pra auth.users removida) pra existir sem uma linha correspondente em auth.users.
//
// Idempotente: pula qualquer nome que já exista como bot (users.is_bot = true AND users.name = X)
// — rodar de novo depois de uma falha parcial não duplica jogadores.
//
// Depois do seed, cmd/simulate-bot-activity mantém os bots ganhando XP ao longo da semana.
//
// Uso:
//
//	DATABASE_URL=... go run ./cmd/seed-league-bots
package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"os"
	"strings"

	"github.com/google/uuid"
	"github.com/joho/godotenv"

	"arqlearn/monolith/internal/db"
	"arqlearn/monolith/internal/gamification"
)

type botPlayer struct {
	name     string
	league   string
	division int
}

// bots: 20 nomes de personagens de jogos por liga, espalhados pelas 3 divisões — lista revisada
// com o usuário antes de rodar (20/08/2026).
var bots = []botPlayer{
	{"Vi", "madeira", 3},
	{"Sergeant Johnson", "madeira", 3},
	{"Jaina Proudmoore", "madeira", 3},
	{"Yusuke", "madeira", 3},
	{"Raiden Shogun", "madeira", 3},
	{"Ranni", "madeira", 3},
	{"Makoto", "madeira", 3},
	{"Noctis", "madeira", 2},
	{"Leon Kennedy", "madeira", 2},
	{"Blanka", "madeira", 2},
	{"Triss Merigold", "madeira", 2},
	{"Lux", "madeira", 2},
	{"Octane", "madeira", 2},
	{"Sonic", "madeira", 2},
	{"Rayman", "madeira", 1},
	{"Zelda", "madeira", 1},
	{"Spyro", "madeira", 1},
	{"Yoshi", "madeira", 1},
	{"Jett", "madeira", 1},
	{"Marth", "madeira", 1},
	{"Arthas Menethil", "pedra", 3},
	{"Vergil", "pedra", 3},
	{"Zarya", "pedra", 3},
	{"GLaDOS", "pedra", 3},
	{"Delphine", "pedra", 3},
	{"Agent 3", "pedra", 3},
	{"Aerith Gainsborough", "pedra", 3},
	{"Knuckles", "pedra", 2},
	{"Chris Redfield", "pedra", 2},
	{"Raiden", "pedra", 2},
	{"9S", "pedra", 2},
	{"Chell", "pedra", 2},
	{"2B", "pedra", 2},
	{"Cynthia", "pedra", 2},
	{"Zhongli", "pedra", 1},
	{"Viper", "pedra", 1},
	{"Waluigi", "pedra", 1},
	{"Siegmeyer", "pedra", 1},
	{"Marie", "pedra", 1},
	{"Ada Wong", "pedra", 1},
	{"Widowmaker", "bronze", 3},
	{"Rosalina", "bronze", 3},
	{"Kazooie", "bronze", 3},
	{"Blue", "bronze", 3},
	{"Revolver Ocelot", "bronze", 3},
	{"Dante", "bronze", 3},
	{"Brock", "bronze", 3},
	{"Hu Tao", "bronze", 2},
	{"Ciri", "bronze", 2},
	{"Yennefer", "bronze", 2},
	{"Gwyn", "bronze", 2},
	{"Peach", "bronze", 2},
	{"Akuma", "bronze", 2},
	{"Coco Bandicoot", "bronze", 2},
	{"Corrin", "bronze", 1},
	{"Fox McCloud", "bronze", 1},
	{"Cuphead", "bronze", 1},
	{"Silver", "bronze", 1},
	{"Vega", "bronze", 1},
	{"Link", "bronze", 1},
	{"Ike", "prata", 3},
	{"Ken Masters", "prata", 3},
	{"Mercy", "prata", 3},
	{"Cloud Strife", "prata", 3},
	{"Malenia", "prata", 3},
	{"Venti", "prata", 3},
	{"Leon", "prata", 3},
	{"Reaper", "prata", 2},
	{"Riku", "prata", 2},
	{"Freya", "prata", 2},
	{"Reyna", "prata", 2},
	{"Albert Wesker", "prata", 2},
	{"Ryu", "prata", 2},
	{"Globox", "prata", 2},
	{"Kitana", "prata", 1},
	{"Squall Leonhart", "prata", 1},
	{"Cammy", "prata", 1},
	{"Impa", "prata", 1},
	{"Katarina", "prata", 1},
	{"Chun-Li", "prata", 1},
	{"Bowser", "ouro", 3},
	{"Lifeline", "ouro", 3},
	{"Roxas", "ouro", 3},
	{"Cortana", "ouro", 3},
	{"Rouge", "ouro", 3},
	{"Mario", "ouro", 3},
	{"Liu Kang", "ouro", 3},
	{"Master Chief", "ouro", 2},
	{"Samus Aran", "ouro", 2},
	{"Hanzo", "ouro", 2},
	{"Radahn", "ouro", 2},
	{"Tracer", "ouro", 2},
	{"Toad", "ouro", 2},
	{"Lydia", "ouro", 2},
	{"Kiryu Kazuma", "ouro", 1},
	{"Phoenix", "ouro", 1},
	{"Sage", "ouro", 1},
	{"Winston", "ouro", 1},
	{"Vincent Valentine", "ouro", 1},
	{"Dr. Eggman", "ouro", 1},
	{"Gordon Freeman", "platina", 3},
	{"Sephiroth", "platina", 3},
	{"Diluc", "platina", 3},
	{"Steve", "platina", 3},
	{"Axel", "platina", 3},
	{"Darius", "platina", 3},
	{"Wario", "platina", 3},
	{"Banjo", "platina", 2},
	{"Solid Snake", "platina", 2},
	{"Bayonetta", "platina", 2},
	{"Cynder", "platina", 2},
	{"Sova", "platina", 2},
	{"Tifa Lockhart", "platina", 2},
	{"Alex", "platina", 2},
	{"Futaba", "platina", 1},
	{"Ling Xiaoyu", "platina", 1},
	{"Morgana", "platina", 1},
	{"Red", "platina", 1},
	{"Herobrine", "platina", 1},
	{"Omen", "platina", 1},
	{"Atreus", "esmeralda", 3},
	{"Zangief", "esmeralda", 3},
	{"Gehrman", "esmeralda", 3},
	{"Amy Rose", "esmeralda", 3},
	{"Xiao", "esmeralda", 3},
	{"Ganondorf", "esmeralda", 3},
	{"Majima Goro", "esmeralda", 3},
	{"Arbiter", "esmeralda", 2},
	{"Heihachi", "esmeralda", 2},
	{"Ash Ketchum", "esmeralda", 2},
	{"Sora", "esmeralda", 2},
	{"Mugman", "esmeralda", 2},
	{"K.K. Slider", "esmeralda", 2},
	{"Guile", "esmeralda", 2},
	{"N", "esmeralda", 1},
	{"Yuna", "esmeralda", 1},
	{"Joker", "esmeralda", 1},
	{"Artorias", "esmeralda", 1},
	{"Bloodhound", "esmeralda", 1},
	{"Dr. Neo Cortex", "esmeralda", 1},
	{"Geralt", "safira", 3},
	{"Daisy", "safira", 3},
	{"Kratos", "safira", 3},
	{"Sylvanas Windrunner", "safira", 3},
	{"Solaire", "safira", 3},
	{"Dandelion", "safira", 3},
	{"Klee", "safira", 3},
	{"Falco Lombardi", "safira", 2},
	{"Genji", "safira", 2},
	{"Big Boss", "safira", 2},
	{"Isabelle", "safira", 2},
	{"Misty", "safira", 2},
	{"Lightning", "safira", 2},
	{"Ridley", "safira", 2},
	{"Midna", "safira", 1},
	{"Kairi", "safira", 1},
	{"Crash Bandicoot", "safira", 1},
	{"Jeanne", "safira", 1},
	{"Callie", "safira", 1},
	{"Jill Valentine", "safira", 1},
	{"Shadow", "rubi", 3},
	{"Tom Nook", "rubi", 3},
	{"Mileena", "rubi", 3},
	{"Yasuo", "rubi", 3},
	{"Jin Kazama", "rubi", 3},
	{"Ezreal", "rubi", 3},
	{"Jinx", "rubi", 3},
	{"Lucio", "rubi", 2},
	{"Zidane Tribal", "rubi", 2},
	{"Nina Williams", "rubi", 2},
	{"Donkey Kong", "rubi", 2},
	{"Dhalsim", "rubi", 2},
	{"Diddy Kong", "rubi", 2},
	{"Kazuya Mishima", "rubi", 2},
	{"Lucina", "rubi", 1},
	{"Melina", "rubi", 1},
	{"Kirby", "rubi", 1},
	{"Tails", "rubi", 1},
	{"Ann Takamaki", "rubi", 1},
	{"King Dedede", "rubi", 1},
	{"Alyx Vance", "diamante", 3},
	{"Bangalore", "diamante", 3},
	{"Reinhardt", "diamante", 3},
	{"Luigi", "diamante", 3},
	{"Meta Knight", "diamante", 3},
	{"Ravio", "diamante", 3},
	{"Cypher", "diamante", 3},
	{"Thresh", "diamante", 2},
	{"Scorpion", "diamante", 2},
	{"Tingle", "diamante", 2},
	{"Sheik", "diamante", 2},
	{"Byleth", "diamante", 2},
	{"Ganyu", "diamante", 2},
	{"Baldur", "diamante", 2},
	{"Nero", "diamante", 1},
	{"Zed", "diamante", 1},
	{"Wraith", "diamante", 1},
	{"Ahri", "diamante", 1},
	{"A2", "diamante", 1},
	{"Sub-Zero", "diamante", 1},
}

func main() {
	_ = godotenv.Load()

	ctx := context.Background()
	pool, err := db.Connect(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("sem conexão com Postgres: %v", err)
	}
	defer pool.Close()

	created, skipped := 0, 0
	for _, b := range bots {
		var exists bool
		if err := pool.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM users WHERE is_bot = true AND name = $1)`, b.name,
		).Scan(&exists); err != nil {
			log.Fatalf("falha ao checar bot existente (%s): %v", b.name, err)
		}
		if exists {
			skipped++
			continue
		}

		rank, ok := gamification.RankFromTierDivision(b.league, b.division)
		if !ok {
			log.Fatalf("liga/divisão inválida pro bot %q: %s/%d", b.name, b.league, b.division)
		}

		userID := uuid.New()
		email := fmt.Sprintf("bot.%s@bots.arqlearn.internal", slug(b.name))

		if _, err := pool.Exec(ctx,
			`INSERT INTO users (id, name, email, is_bot) VALUES ($1, $2, $3, true)`,
			userID, b.name, email,
		); err != nil {
			log.Fatalf("falha ao criar usuário bot %s: %v", b.name, err)
		}

		if _, err := pool.Exec(ctx,
			`INSERT INTO user_gamification (user_id, current_tier) VALUES ($1, $2)`,
			userID, rank,
		); err != nil {
			log.Fatalf("falha ao criar gamificação do bot %s: %v", b.name, err)
		}

		// XP inicial da semana pra não nascer todo mundo empatado em zero — banda ampla (20-400)
		// já dá variedade de posição dentro da divisão logo na criação.
		initialXP := 20 + rand.Intn(381)
		if err := gamification.AddWeeklyXP(ctx, pool, userID.String(), initialXP); err != nil {
			log.Fatalf("falha ao dar XP inicial ao bot %s: %v", b.name, err)
		}

		created++
		log.Printf("bot criado: %-24s -> %s/%d (rank=%d, xp_semana=%d)", b.name, b.league, b.division, rank, initialXP)
	}

	log.Printf("concluído: %d bots criados, %d já existiam (pulados).", created, skipped)
}

func slug(name string) string {
	s := strings.ToLower(name)
	s = strings.NewReplacer(" ", "-", ".", "", "'", "").Replace(s)
	return s
}
