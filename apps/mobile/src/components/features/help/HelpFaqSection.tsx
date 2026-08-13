import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { colors, spacing, type } from "@/theme/tokens";

interface FaqEntry {
  icon: IconName;
  question: string;
  answer: string;
}

// Conteúdo fixo, sem endpoint — mesmo padrão do catálogo da Loja (mockShopCatalog). Espelha
// apps/web/src/components/features/help/HelpFaqSection.tsx.
const faqEntries: FaqEntry[] = [
  {
    icon: "hearts",
    question: "O que são as vidas?",
    answer:
      "Cada resposta errada custa 1 vida. Sem vidas, você não consegue começar uma nova lição. Elas se regeneram sozinhas, 1 a cada 3 horas, até o teto de 5 — ou você pode restaurar todas na hora com gemas, tocando no ícone de coração no topo.",
  },
  {
    icon: "streak",
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
    icon: "gems",
    question: "Como eu ganho gemas?",
    answer:
      "Gemas são a moeda do jogo — dá pra usar pra restaurar vidas, comprar Bloqueio de Ofensiva ou itens cosméticos na Loja. Reportar um bug que a gente corrige dá 10 gemas, e sugerir uma melhoria que a gente implementa dá 50.",
  },
  {
    icon: "allInclusive",
    question: "O que é o Modo Infinito?",
    answer:
      "Prática sem fim, com perguntas de dificuldade elevada sobre o tema escolhido — não consome vidas nem faz parte do progresso de nenhuma lição específica, é só treino livre.",
  },
  {
    icon: "bugReport",
    question: "O que acontece quando eu reporto um bug ou sugiro uma melhoria?",
    answer:
      "Seu relato (descrição, print e — se for bug — modelo/tipo do dispositivo) vai direto pra um administrador revisar. Se o bug for corrigido, você ganha 10 gemas; se a melhoria for implementada, ganha 50 — nos dois casos, com uma notificação de agradecimento avisando.",
  },
];

export function HelpFaqSection() {
  return (
    <View style={styles.section}>
      <Text style={[type.headlineMd, styles.title]}>Como o ArqLearn funciona</Text>
      <View style={styles.list}>
        {faqEntries.map((entry) => (
          <Card key={entry.question} padding="md" radius="lg" style={styles.card}>
            <Icon name={entry.icon} size={22} color={colors.primary} />
            <View style={styles.textBlock}>
              <Text style={[type.bodyLg, styles.question]}>{entry.question}</Text>
              <Text style={[type.bodySm, styles.answer]}>{entry.answer}</Text>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  title: {
    color: colors.onSurface,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  textBlock: {
    flex: 1,
  },
  question: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  answer: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
});
