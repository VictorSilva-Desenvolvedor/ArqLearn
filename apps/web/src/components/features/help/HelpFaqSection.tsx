import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

interface FaqEntry {
  icon: string;
  question: string;
  answer: string;
}

// Conteúdo fixo, sem endpoint — mesmo padrão do catálogo da Loja (mockShopCatalog): texto vive só
// no cliente, não tem contrato de API (ver API Spec §14).
const faqEntries: FaqEntry[] = [
  {
    icon: "favorite",
    question: "O que são as vidas?",
    answer:
      "Cada resposta errada custa 1 vida. Sem vidas, você não consegue começar uma nova lição. Elas se regeneram sozinhas, 1 a cada 36 minutos, até o teto de 5 — ou você pode restaurar todas na hora com gemas, clicando no ícone de coração no topo.",
  },
  {
    icon: "local_fire_department",
    question: "Como funciona a sequência (streak)?",
    answer:
      "Sua sequência sobe em 1 toda vez que você pratica pelo menos uma lição no dia (no seu fuso horário). Se faltar um dia, ela zera — a menos que você use um Bloqueio de Ofensiva antes, que protege a sequência daquele dia perdido.",
  },
  {
    icon: "bolt",
    question: "O que são XP e nível?",
    answer:
      "Você ganha XP por resposta certa (mais rápido = bônus de velocidade, terminar a lição pela primeira vez = bônus extra). O XP acumulado define seu nível — cada nível seguinte exige mais XP que o anterior. Existe um limite diário de XP; depois dele, a prática continua valendo, só o XP some.",
  },
  {
    icon: "diamond",
    question: "Como eu ganho gemas?",
    answer:
      "Gemas são a moeda do jogo — dá pra usar pra restaurar vidas, comprar Bloqueio de Ofensiva ou itens cosméticos na Loja. Reportar um bug que a gente corrige dá 10 gemas, e sugerir uma melhoria que a gente implementa dá 50.",
  },
  {
    icon: "all_inclusive",
    question: "O que é o Modo Infinito?",
    answer:
      "Prática sem fim, com perguntas de dificuldade elevada sobre o tema escolhido — não consome vidas nem faz parte do progresso de nenhuma lição específica, é só treino livre.",
  },
  {
    icon: "bug_report",
    question: "O que acontece quando eu reporto um bug ou sugiro uma melhoria?",
    answer:
      "Seu relato (descrição, print e — se for bug — modelo/tipo do dispositivo) vai direto pra um administrador revisar. Se o bug for corrigido, você ganha 10 gemas; se a melhoria for implementada, ganha 50 — nos dois casos, com uma notificação de agradecimento avisando.",
  },
];

export function HelpFaqSection() {
  return (
    <section className="flex flex-col gap-sm">
      <h2 className="font-display text-headline-md text-on-surface">Como o ArqLearn funciona</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
        {faqEntries.map((entry) => (
          <Card key={entry.question} padding="md" radius="lg" className="flex gap-sm items-start">
            <Icon name={entry.icon} filled className="text-2xl text-primary shrink-0 mt-1" />
            <div>
              <p className="font-body-lg text-body-lg font-bold text-on-surface">{entry.question}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{entry.answer}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
