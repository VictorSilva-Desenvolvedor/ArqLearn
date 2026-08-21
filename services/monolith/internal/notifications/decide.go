// Decide é o laço de decisão de notificação (TDD §11) — roda de hora em hora (cmd/notify-decide),
// substitui o antigo NotifyStreaksAtRisk. Por rodada: avalia a recompensa de envios passados,
// depois decide se manda uma notificação nova pra cada candidato elegível, escolhendo o template
// via SelecionarTemplate (bandit.go) e respeitando a janela horária local (TDD §5.2), o cooldown
// de template e o teto diário (RX-05).
package notifications

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"arqlearn/monolith/internal/expoclient"
	"arqlearn/monolith/internal/gamification"
)

// janelaInicioHoraLocal/janelaFimHoraLocal implementam a "janela configurável antes da meia-noite"
// que a TDD §5.2 já pedia (ex.: 20h-21h local) — nunca tinha sido de fato implementada, o job
// antigo mandava a qualquer hora que alguém rodasse o comando manualmente.
const janelaInicioHoraLocal = 20
const janelaFimHoraLocal = 22

// janelaRecompensa é quanto tempo depois do envio a recompensa é avaliada (TDD §11) — dá tempo
// suficiente pro usuário ver a notificação e praticar no mesmo dia, sem esperar demais pra
// atualizar o bandit.
const janelaRecompensa = 24 * time.Hour

// cooldownDias: não repetir o mesmo template pro mesmo usuário antes disso — exclusão dura, não
// uma curva de decaimento tipo esquecimento (aplicar SM-2/HLR a fadiga de notificação é um salto
// conceitual maior do que vale a pena agora, TDD §11).
const cooldownDias = 3

// tetoNotificacoesDia (RX-05, Docs/ArqLearn_Backlog_Gamificacao_Atelie.md §2.4 ponto 3): no máximo
// esta quantidade de notificações por dia local, contando TODOS os tipos — não só as escolhidas
// pelo bandit (bug_fixed/suggestion_implemented também contam).
const tetoNotificacoesDia = 2

// janelaLocalAberta diz se `agora`, convertido pro fuso `timezone`, cai dentro de
// [inicioHora, fimHora) — mesmo fallback de gamification.HojeLocal pra fuso inválido (UTC em vez
// de derrubar a rodada inteira por um timezone malformado).
func janelaLocalAberta(timezone string, agora time.Time, inicioHora, fimHora int) bool {
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		loc = time.UTC
	}
	hora := agora.In(loc).Hour()
	return hora >= inicioHora && hora < fimHora
}

type envioPendente struct {
	id          string
	userID      string
	triggerType string
	templateID  string
	sentAt      time.Time
}

// AvaliarRecompensasPendentes varre notification_sends ainda não avaliados cuja janela de
// recompensa (24h) já fechou, checa se o usuário praticou nesse intervalo
// (gamification.EventItemRespondido em gamification_events) e credita a estatística do template
// correspondente. Best-effort por linha: uma falha é logada e não impede as demais.
func AvaliarRecompensasPendentes(ctx context.Context, pool *pgxpool.Pool) error {
	limite := time.Now().UTC().Add(-janelaRecompensa)
	rows, err := pool.Query(ctx, `
		SELECT id, user_id, trigger_type, template_id, sent_at
		FROM notification_sends
		WHERE evaluated_at IS NULL AND sent_at <= $1
	`, limite)
	if err != nil {
		return fmt.Errorf("notifications: falha ao consultar envios pendentes de avaliação: %w", err)
	}
	var pendentes []envioPendente
	for rows.Next() {
		var p envioPendente
		if err := rows.Scan(&p.id, &p.userID, &p.triggerType, &p.templateID, &p.sentAt); err != nil {
			rows.Close()
			return fmt.Errorf("notifications: falha ao ler envio pendente: %w", err)
		}
		pendentes = append(pendentes, p)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}

	for _, p := range pendentes {
		if err := avaliarUmEnvio(ctx, pool, p); err != nil {
			log.Printf("aviso: falha ao avaliar recompensa do envio %s (user_id=%s): %v", p.id, p.userID, err)
		}
	}
	return nil
}

// avaliarUmEnvio isolada numa função própria (não inline no loop acima) pra o `defer
// tx.Rollback(ctx)` valer por linha avaliada, não só no fim da função inteira.
func avaliarUmEnvio(ctx context.Context, pool *pgxpool.Pool, p envioPendente) error {
	var praticou bool
	err := pool.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM gamification_events
			WHERE user_id = $1 AND event_type = $2 AND created_at >= $3 AND created_at < $4
		)
	`, p.userID, string(gamification.EventItemRespondido), p.sentAt, p.sentAt.Add(janelaRecompensa)).Scan(&praticou)
	if err != nil {
		// Erro de consulta != "sem atividade" — não avalia esta linha agora (evaluated_at
		// continua NULL, tenta de novo na próxima rodada). Nota: gamification.EventsEnabled
		// desligado faria EventItemRespondido nunca ser gravado pra ninguém — toda avaliação
		// futura leria "sem atividade" e envenenaria o bandit silenciosamente. Kill-switch
		// documentado em internal/gamification/events.go; se algum dia for desligado, este job
		// precisa ser pausado junto.
		return fmt.Errorf("falha ao consultar atividade pós-envio: %w", err)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("falha ao abrir transação: %w", err)
	}
	defer tx.Rollback(ctx)

	campo := "failures"
	if praticou {
		campo = "successes"
	}
	if _, err := tx.Exec(ctx, `
		UPDATE notification_template_stats SET `+campo+` = `+campo+` + 1, updated_at = now()
		WHERE trigger_type = $1 AND template_id = $2
	`, p.triggerType, p.templateID); err != nil {
		return fmt.Errorf("falha ao atualizar estatística do template: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		UPDATE notification_sends SET evaluated_at = now(), rewarded = $1 WHERE id = $2
	`, praticou, p.id); err != nil {
		return fmt.Errorf("falha ao marcar envio como avaliado: %w", err)
	}
	return tx.Commit(ctx)
}

type streakCandidato struct {
	userID           string
	timezone         string
	streakCurrent    int
	lastActiveDate   *time.Time
	freezesAvailable int
}

// streakAtRiscoCandidatos é a mesma consulta que NotifyStreaksAtRisk já usava — extraída aqui pra
// ser reaproveitada por Decide, não escrita de novo.
func streakAtRiscoCandidatos(ctx context.Context, pool *pgxpool.Pool) ([]streakCandidato, error) {
	rows, err := pool.Query(ctx, `
		SELECT u.id, u.timezone, g.streak_current, g.streak_last_active_date, g.streak_freezes_available
		FROM users u JOIN user_gamification g ON g.user_id = u.id
		WHERE g.streak_current > 0 AND u.push_enabled = true AND u.deleted_at IS NULL
	`)
	if err != nil {
		return nil, fmt.Errorf("falha ao consultar streaks ativas: %w", err)
	}
	defer rows.Close()

	var candidatos []streakCandidato
	for rows.Next() {
		var c streakCandidato
		if err := rows.Scan(&c.userID, &c.timezone, &c.streakCurrent, &c.lastActiveDate, &c.freezesAvailable); err != nil {
			return nil, fmt.Errorf("falha ao ler linha de streak: %w", err)
		}
		candidatos = append(candidatos, c)
	}
	return candidatos, rows.Err()
}

// notificacoesHojeLocal conta quantas notificações (TODOS os tipos, RX-05) o usuário já recebeu no
// dia local corrente — consulta a coleção Mongo notifications inteira (não só as via bandit),
// reaproveitando o índice {user_id:1, created_at:-1} que já existe. Busca as últimas 36h (cobre
// qualquer fuso) e filtra por data local em Go, mesmo motivo de jaEnviadoTriggerHojeLocal abaixo.
func notificacoesHojeLocal(ctx context.Context, mongoDB *mongo.Database, userID, timezone string, agora time.Time) (int, error) {
	cur, err := mongoDB.Collection("notifications").Find(ctx, bson.M{
		"user_id":    userID,
		"created_at": bson.M{"$gte": agora.Add(-36 * time.Hour)},
	})
	if err != nil {
		return 0, err
	}
	defer cur.Close(ctx)

	hojeLocal := gamification.HojeLocal(timezone, agora)
	count := 0
	for cur.Next(ctx) {
		var doc struct {
			CreatedAt time.Time `bson:"created_at"`
		}
		if err := cur.Decode(&doc); err != nil {
			return 0, err
		}
		if gamification.HojeLocal(timezone, doc.CreatedAt) == hojeLocal {
			count++
		}
	}
	return count, cur.Err()
}

// templatesEmCooldown devolve os templates enviados a este usuário pro trigger nos últimos
// cooldownDias, e se streak_at_risk já foi enviado no dia local corrente (guarda extra: sem isso,
// rodar de hora em hora dentro da janela da noite mandaria mais de um lembrete na mesma noite, com
// templates diferentes escapando do cooldown de 3 dias).
func templatesEmCooldown(ctx context.Context, pool *pgxpool.Pool, userID, triggerType, timezone string, agora time.Time) (excluidos map[TemplateID]bool, jaEnviadoHoje bool, err error) {
	rows, err := pool.Query(ctx, `
		SELECT template_id, sent_at FROM notification_sends
		WHERE user_id = $1 AND trigger_type = $2 AND sent_at >= $3
	`, userID, triggerType, agora.AddDate(0, 0, -cooldownDias-1))
	if err != nil {
		return nil, false, err
	}
	defer rows.Close()

	hojeLocal := gamification.HojeLocal(timezone, agora)
	excluidos = map[TemplateID]bool{}
	for rows.Next() {
		var templateID string
		var sentAt time.Time
		if err := rows.Scan(&templateID, &sentAt); err != nil {
			return nil, false, err
		}
		diasAtras := int(agora.Sub(sentAt).Hours() / 24)
		if diasAtras < cooldownDias {
			excluidos[TemplateID(templateID)] = true
		}
		if gamification.HojeLocal(timezone, sentAt) == hojeLocal {
			jaEnviadoHoje = true
		}
	}
	return excluidos, jaEnviadoHoje, rows.Err()
}

// carregarStatsTemplates lê notification_template_stats do trigger — cada linha já entra semeada
// com prior (1,1) pela migration 0018, então todo template configurado em bandit.go sempre tem
// uma linha correspondente (a menos que uma variação nova ainda não tenha migration própria).
func carregarStatsTemplates(ctx context.Context, pool *pgxpool.Pool, triggerType string) (map[TemplateID]TemplateStats, error) {
	rows, err := pool.Query(ctx, `
		SELECT template_id, successes, failures FROM notification_template_stats WHERE trigger_type = $1
	`, triggerType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := map[TemplateID]TemplateStats{}
	for rows.Next() {
		var templateID string
		var s TemplateStats
		if err := rows.Scan(&templateID, &s.Successes, &s.Failures); err != nil {
			return nil, err
		}
		stats[TemplateID(templateID)] = s
	}
	return stats, rows.Err()
}

// Decide implementa o laço de notificação da TDD §11 — chamada por cmd/notify-decide, uma vez por
// hora. agora é explícito (não time.Now() escondido) pelo mesmo motivo de
// gamification.AplicarExpiracaoStreak(hojeLocal string): testável sem depender do relógio real.
func Decide(ctx context.Context, pool *pgxpool.Pool, mongoDB *mongo.Database, expo *expoclient.Client, agora time.Time) error {
	if err := AvaliarRecompensasPendentes(ctx, pool); err != nil {
		log.Printf("aviso: falha ao avaliar recompensas pendentes: %v", err)
	}

	candidatos, err := streakAtRiscoCandidatos(ctx, pool)
	if err != nil {
		return fmt.Errorf("notifications: %w", err)
	}

	statsTemplates, err := carregarStatsTemplates(ctx, pool, TriggerStreakAtRisk)
	if err != nil {
		return fmt.Errorf("notifications: falha ao carregar estatísticas de template: %w", err)
	}

	enviados := 0
	for _, c := range candidatos {
		if !janelaLocalAberta(c.timezone, agora, janelaInicioHoraLocal, janelaFimHoraLocal) {
			continue
		}

		lastActiveStr := ""
		if c.lastActiveDate != nil {
			lastActiveStr = c.lastActiveDate.Format("2006-01-02")
		}
		hojeLocal := gamification.HojeLocal(c.timezone, agora)
		streakCurrent, _, _, _ := gamification.AplicarExpiracaoStreak(c.streakCurrent, lastActiveStr, c.freezesAvailable, hojeLocal)
		if !gamification.StreakEmRisco(streakCurrent, lastActiveStr, hojeLocal) {
			continue
		}

		notifsHoje, err := notificacoesHojeLocal(ctx, mongoDB, c.userID, c.timezone, agora)
		if err != nil {
			log.Printf("aviso: falha ao checar teto diário de notificações (user_id=%s): %v", c.userID, err)
			continue
		}
		if notifsHoje >= tetoNotificacoesDia {
			continue
		}

		excluidos, jaEnviadoHoje, err := templatesEmCooldown(ctx, pool, c.userID, TriggerStreakAtRisk, c.timezone, agora)
		if err != nil {
			log.Printf("aviso: falha ao checar cooldown de template (user_id=%s): %v", c.userID, err)
			continue
		}
		if jaEnviadoHoje {
			continue
		}

		templateID := SelecionarTemplate(statsTemplates, excluidos)
		title, body := StreakRiscoMensagem(templateID, streakCurrent)
		if title == "" {
			log.Printf("aviso: template %q sem mensagem cadastrada (user_id=%s)", templateID, c.userID)
			continue
		}

		if err := Create(ctx, mongoDB, c.userID, TriggerStreakAtRisk, body); err != nil {
			log.Printf("aviso: falha ao gravar notificação in-app (user_id=%s): %v", c.userID, err)
		}

		tokenRows, err := pool.Query(ctx, `SELECT token FROM user_push_tokens WHERE user_id = $1`, c.userID)
		if err != nil {
			log.Printf("aviso: falha ao buscar tokens de push (user_id=%s): %v", c.userID, err)
			continue
		}
		var tokens []string
		for tokenRows.Next() {
			var token string
			if err := tokenRows.Scan(&token); err == nil {
				tokens = append(tokens, token)
			}
		}
		tokenRows.Close()

		if len(tokens) > 0 {
			if err := expo.SendPush(ctx, tokens, title, body, map[string]any{"type": TriggerStreakAtRisk}); err != nil {
				log.Printf("aviso: falha ao enviar push (user_id=%s): %v", c.userID, err)
			}
		}

		if _, err := pool.Exec(ctx, `
			INSERT INTO notification_sends (user_id, trigger_type, template_id, sent_at)
			VALUES ($1, $2, $3, $4)
		`, c.userID, TriggerStreakAtRisk, string(templateID), agora); err != nil {
			log.Printf("aviso: falha ao registrar envio (user_id=%s): %v", c.userID, err)
		}

		enviados++
	}

	log.Printf("notify-decide: %d/%d usuários com streak ativa notificados", enviados, len(candidatos))
	return nil
}
