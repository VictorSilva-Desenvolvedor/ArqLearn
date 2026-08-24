import { StyleSheet, Text, View } from "react-native";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { IconName } from "@/components/ui/Icon";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import { CurrentLessonNode } from "./CurrentLessonNode";
import { LessonNode, type LessonNodeVariant } from "./LessonNode";
import { PathConnector } from "./PathConnector";

// "available" = tem lição com pergunta de verdade, mas nada foi começado ainda (não é mais
// "bloqueado" — a trilha inteira ficava esmaecida mesmo tendo conteúdo pronto pra praticar).
// "construction" = nenhuma lição da trilha tem pergunta aprovada ainda.
export type UnitStatus = "completed" | "current" | "available" | "construction";

export interface UnitNodeData {
  lessonId: string;
  icon: IconName;
  variant: LessonNodeVariant;
  href: string;
  ctaLabel?: string;
}

interface UnitSectionProps {
  title: string;
  subtitle?: string;
  status: UnitStatus;
  nodes: UnitNodeData[];
}

const statusBadge: Record<UnitStatus, { label: string; tone: BadgeTone }> = {
  completed: { label: "Concluído", tone: "primary" },
  // Estado de navegação/progresso — azul primário, não laranja (reservado à camada de
  // gamificação/recompensa; ver DESIGN.md "The One Job Per Color Rule").
  current: { label: "Em andamento", tone: "primary" },
  available: { label: "Disponível", tone: "primary" },
  construction: { label: "Em construção", tone: "neutral" },
};

export function UnitSection({ title, subtitle, status, nodes }: UnitSectionProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const badge = statusBadge[status];

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[type.headlineMd, { color: colors.onSurface }]}>{title}</Text>
        {/* Badge NUNCA fica dentro do wrapper `dimmed` abaixo — opacity:0.6 sobre o par de cores
            já escurecido do tone "neutral" derrubava o contraste efetivo pra ~2.3:1, bem abaixo
            do mínimo AA de 4.5:1 mesmo com o token correto (achado de /impeccable audit,
            2026-08-17 — o fix anterior corrigiu o token mas não esse contexto). */}
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </View>
      <View style={status === "construction" && styles.dimmed}>
        {/* O card só existe quando há um subtítulo de verdade pra carregar. Antes ele repetia
            `title` — exatamente a mesma string do heading logo acima, sem informação nova (achado
            da auditoria visual da Home, 24/08/2026). Espelha apps/web/.../UnitSection.tsx. */}
        {subtitle && (
          <Card
            padding="md"
            radius="xl"
            style={[
              styles.summaryCard,
              status === "current" && styles.summaryCardCurrent,
              status === "completed" && styles.summaryCardCompleted,
            ]}
          >
            <Text style={[type.bodyMdBold, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>
          </Card>
        )}
        <View style={styles.path}>
          {nodes.length > 1 && <PathConnector dashed={status === "current"} />}
          {nodes.map((node, index) => (
            <View
              key={node.lessonId}
              // spacing.xl (32px) via token em vez de número mágico — mesmo padrão corrigido em
              // apps/web/UnitSection.tsx.
              style={[
                styles.nodeSlot,
                { transform: [{ translateX: index % 2 === 0 ? -spacing.xl : spacing.xl }] },
              ]}
            >
              {node.variant === "current" ? (
                <CurrentLessonNode icon={node.icon} href={node.href} ctaLabel={node.ctaLabel} />
              ) : (
                <LessonNode variant={node.variant} icon={node.icon} href={node.href} />
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    wrap: {
      width: "100%",
      marginBottom: 48,
    },
    dimmed: {
      opacity: 0.6,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    summaryCard: {
      marginBottom: 8,
    },
    summaryCardCurrent: {
      borderColor: colors.primary,
    },
    summaryCardCompleted: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceGray,
    },
    path: {
      position: "relative",
      alignItems: "center",
      gap: 32,
      paddingVertical: 24,
    },
    nodeSlot: {
      position: "relative",
      zIndex: 10,
    },
  });
