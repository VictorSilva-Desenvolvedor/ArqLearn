// Camada de eventos/telemetria (Fase 1 — Fundação do porte de gamificação, ver
// Docs/ArqLearn_Backlog_Gamificacao_Atelie.md §1.1). Antes desta mudança, a tabela
// gamification_events (migrations/0001_init) existia no schema mas nenhum INSERT jamais foi
// emitido em nenhum lugar do código — bloqueio estrutural registrado no inventário do porte,
// porque sem eventos não há como medir se qualquer outro sistema de gamificação funciona.
package gamification

import (
	"context"
	"encoding/json"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

// EventsEnabled: kill-switch da camada de eventos inteira, mesmo padrão de
// VIPSubscriptionsEnabled (vip.go) — flag de código, não de runtime (sem infra de feature flag
// no projeto ainda). Desligar não quebra nenhuma tela nem deixa dado órfão: RecordEvent vira
// no-op, o resto do sistema (XP, vidas, streak) continua gravando exatamente como hoje, porque
// nenhum desses fluxos depende do evento ter sido gravado com sucesso.
const EventsEnabled = true

// EventType: os identificadores de evento mínimos da Fase 1 (RT-02 do documento de regras).
// item_divergente_avaliado e meta_atingida ficam de fora por ora — não existe ainda item
// divergente nem meta diária configurável no backend (Fases 3 e 1.4 do backlog,
// respectivamente); adicionar o nome do evento antes do sistema que o dispara existir criaria
// um evento que nunca é emitido, o oposto de telemetria útil.
type EventType string

const (
	EventSessaoIniciada   EventType = "sessao_iniciada"
	EventSessaoConcluida  EventType = "sessao_concluida"
	EventSessaoAbandonada EventType = "sessao_abandonada"
	EventItemRespondido   EventType = "item_respondido"
	EventXPCreditado      EventType = "xp_creditado"
	EventGrafiteConsumido EventType = "grafite_consumido"
	EventGrafiteEsgotado  EventType = "grafite_esgotado"
	// EventStreakFreezeConsumed/EventStreakReset: identificadores em inglês (fora do padrão em
	// português do resto do bloco) de propósito — os literais já são pinados pelo TDD §5.3 em
	// inglês; um identificador Go em português apontando pra um valor em inglês seria um
	// descompasso mais confuso do que a inconsistência de idioma em si.
	EventStreakFreezeConsumed EventType = "streak_freeze_consumed"
	EventStreakReset          EventType = "streak_reset"
	// EventStreakRepaired: novo (RS-08, TDD §5.5) — fecha o par reset→reparado na mesma telemetria.
	EventStreakRepaired EventType = "streak_repaired"
)

// RecordEvent grava uma linha em gamification_events. Best-effort e nunca bloqueia o caller —
// mesmo padrão já estabelecido para conquistas (EvaluateAndUnlock) e XP semanal de liga
// (AddWeeklyXP): perder um evento de telemetria ocasionalmente é aceitável, perder XP/vidas/
// streak de verdade não é. Por isso RecordEvent não devolve erro — só loga um aviso e segue.
//
// value é opcional (nil quando o evento não tem uma grandeza numérica natural, ex.:
// sessao_iniciada); metadata é serializado como o payload versionado da RT-02 do documento de
// regras — sempre inclui "schema_version" pra dar pra evoluir o formato sem quebrar consultas
// antigas.
func RecordEvent(ctx context.Context, pool *pgxpool.Pool, userID string, eventType EventType, value *int, metadata map[string]any) {
	if !EventsEnabled {
		return
	}
	if metadata == nil {
		metadata = map[string]any{}
	}
	metadata["schema_version"] = 1

	metaJSON, err := json.Marshal(metadata)
	if err != nil {
		log.Printf("aviso: falha ao serializar metadata do evento %s (user_id=%s): %v", eventType, userID, err)
		return
	}

	// string(metaJSON), não o []byte cru — mesmo motivo documentado em answers.go
	// (handleSubmitAnswer): o pool roda em QueryExecModeSimpleProtocol (Supavisor), que manda um
	// []byte como literal bytea em vez de jsonb.
	if _, err := pool.Exec(ctx, `
		INSERT INTO gamification_events (user_id, event_type, value, metadata) VALUES ($1, $2, $3, $4)
	`, userID, string(eventType), value, string(metaJSON)); err != nil {
		log.Printf("aviso: falha ao gravar evento %s (user_id=%s): %v", eventType, userID, err)
	}
}

// IntPtr: helper pra literal `*int` inline nos call sites de RecordEvent (value é opcional).
// Exportado porque os call sites de RecordEvent vivem majoritariamente em internal/learning, não
// aqui — sem isso cada pacote chamador precisaria da própria cópia do mesmo helper de 2 linhas.
func IntPtr(v int) *int {
	return &v
}
