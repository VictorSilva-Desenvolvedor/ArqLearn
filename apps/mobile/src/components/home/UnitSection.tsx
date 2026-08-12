import { StyleSheet, Text, View } from "react-native";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { IconName } from "@/components/ui/Icon";
import { colors, type } from "@/theme/tokens";
import { CurrentLessonNode } from "./CurrentLessonNode";
import { FogOverlay } from "./FogOverlay";
import { LessonNode, type LessonNodeVariant } from "./LessonNode";
import { PathConnector } from "./PathConnector";

export type UnitStatus = "completed" | "current" | "locked";

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
  current: { label: "Em andamento", tone: "secondary" },
  locked: { label: "Bloqueado", tone: "neutral" },
};

// Espelha apps/web's UnitSection.tsx: quantos nós "foggy" de fachada renderizar depois do
// último visível de verdade — fixo, não escala com quantas lições realmente existem depois.
// Sem isso dava pra rolar a tela, medir a altura da névoa e contar quantas lições estão
// escondidas — truncar aqui garante o mesmo visual independente de faltarem 3 ou 300 lições.
const TEASER_FOGGY_COUNT = 2;

export function UnitSection({ title, subtitle, status, nodes }: UnitSectionProps) {
  const badge = statusBadge[status];
  const firstFoggyIndex = nodes.findIndex((n) => n.variant === "foggy");
  const visibleNodes = firstFoggyIndex >= 0 ? nodes.slice(0, firstFoggyIndex + TEASER_FOGGY_COUNT) : nodes;
  // Começa a névoa um pouco antes do primeiro nó "foggy" (não em cima dele) — esmaece
  // gradual em vez de corte seco. Calculado sobre visibleNodes, que é o que define a altura
  // real do container.
  const fogTopPercent =
    firstFoggyIndex >= 0 ? Math.max(0, (firstFoggyIndex / visibleNodes.length) * 100 - 10) : null;

  return (
    <View style={[styles.wrap, status === "locked" && styles.dimmed]}>
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
        <Text style={[type.bodyMdBold, { color: status === "current" ? colors.secondary : colors.onSurfaceVariant }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>{subtitle}</Text>
        )}
      </Card>
      <View style={styles.path}>
        {visibleNodes.length > 1 && <PathConnector dashed={status === "current"} />}
        {visibleNodes.map((node, index) => (
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
        {fogTopPercent !== null && <FogOverlay topPercent={fogTopPercent} />}
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
    borderColor: colors.secondary,
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
