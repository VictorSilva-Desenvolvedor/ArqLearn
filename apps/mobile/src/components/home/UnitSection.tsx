import { StyleSheet, Text, View } from "react-native";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { IconName } from "@/components/ui/Icon";
import { colors, type } from "@/theme/tokens";
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
  const badge = statusBadge[status];

  return (
    <View style={[styles.wrap, status === "construction" && styles.dimmed]}>
      <View style={styles.header}>
        <Text style={[type.headlineMd, { color: colors.onSurface }]}>{title}</Text>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </View>
      <Card
        padding="md"
        radius="xl"
        style={[
          styles.summaryCard,
          status === "current" && styles.summaryCardCurrent,
          status === "completed" && styles.summaryCardCompleted,
        ]}
      >
        <Text style={[type.bodyMdBold, { color: status === "current" ? colors.primary : colors.onSurfaceVariant }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>{subtitle}</Text>
        )}
      </Card>
      <View style={styles.path}>
        {nodes.length > 1 && <PathConnector dashed={status === "current"} />}
        {nodes.map((node, index) => (
          <View
            key={node.lessonId}
            style={[styles.nodeSlot, { transform: [{ translateX: index % 2 === 0 ? -32 : 32 }] }]}
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
  );
}

const styles = StyleSheet.create({
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
