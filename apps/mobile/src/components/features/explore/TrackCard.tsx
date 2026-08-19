import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { RecommendedTrack } from "@/lib/api/mocks/fixtures/exploreTracks";

interface TrackCardProps extends RecommendedTrack {
  isSelectedTheme?: boolean;
  onPress?: () => void;
}

// Espelha apps/web/src/components/features/explore/TrackCard.tsx. Toque reaproveita o
// ThemeSelector (mesmo setTopic do explorar.tsx) pra ter um efeito real, em vez de ficar mudo.
// hasContent:false (ver exploreTracks.ts/themes.ts) troca o selo de dificuldade/duração — que
// seriam inventados, a trilha não existe de verdade ainda — por "Em construção" (mesma
// convenção/tom de UnitSection.tsx) e esmaece o card.
// Sem `disabled` no Pressable de propósito — este card fica numa grade dentro de uma ScrollView
// (explorar.tsx); um Pressable desabilitado ali é a mesma armadilha do Android já corrigida em
// ThemeSelector.tsx/Button.tsx (trava o gesto de arrastar). `onPress` sempre vem preenchido hoje,
// mas isso evita a armadilha se algum dia deixar de vir.
export function TrackCard({ track, difficulty, durationMinutes, icon, isSelectedTheme, hasContent, onPress }: TrackCardProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  return (
    <Pressable onPress={() => onPress?.()} accessibilityState={{ disabled: !onPress }}>
      <Card
        padding="md"
        radius="lg"
        style={[styles.card, isSelectedTheme && styles.selected, !hasContent && styles.underConstruction]}
      >
        {isSelectedTheme && (
          <View style={styles.badgeWrap}>
            <Badge tone="primary">Selecionado</Badge>
          </View>
        )}
        <Icon name={icon} size={28} color={colors.primary} />
        {/* numberOfLines sozinho só limita o MÁXIMO — um título de 1 linha ainda deixava esse
            card mais baixo que um vizinho de 2 linhas na mesma grade (achado ao vivo,
            19/08/2026: cards de tamanhos visivelmente diferentes). minHeight no estilo reserva o
            espaço de 2 linhas sempre, mesmo pra título curto. */}
        <Text style={[type.questionSm, styles.title]} numberOfLines={2}>
          {track.title}
        </Text>
        {hasContent ? (
          <View style={styles.meta}>
            <Badge tone="primary">{difficulty}</Badge>
            <View style={styles.duration}>
              <Icon name="schedule" size={16} color={colors.onSurfaceVariant} />
              <Text style={[type.bodySm, styles.durationText]}>{durationMinutes}min</Text>
            </View>
          </View>
        ) : (
          <Badge tone="neutral">Em construção</Badge>
        )}
      </Card>
    </Pressable>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      flex: 1,
      gap: 8,
      position: "relative",
    },
    selected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryFixed,
    },
    underConstruction: {
      opacity: 0.6,
    },
    badgeWrap: {
      position: "absolute",
      top: 8,
      right: 8,
    },
    title: {
      color: colors.onSurface,
      fontWeight: "700",
      // 2 × questionSm.lineHeight (24px, ver theme/tokens.ts) — reserva o espaço de 2 linhas
      // sempre, pra um título de 1 linha não deixar o card mais baixo que o vizinho na grade.
      minHeight: 48,
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    duration: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    durationText: {
      color: colors.onSurfaceVariant,
    },
  });
