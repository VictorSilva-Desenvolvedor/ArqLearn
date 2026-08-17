import { StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { levelTitleFor } from "@/lib/gamification/levelTitle";
import { xpMinimoDoNivel } from "@/lib/gamification/level";
import { colors, type } from "@/theme/tokens";

interface ProfileHeaderProps {
  name: string;
  level: number;
  xpTotal: number;
  // VIP "Mestre Arquiteto" (a pedido do usuário): coroa ao lado do nome, nome em tom dourado e
  // selo abaixo do nível — modelado no mockup de Perfil VIP.
  vip?: boolean;
}

// Espelha apps/web/src/components/features/profile/ProfileHeader.tsx.
export function ProfileHeader({ name, level, xpTotal, vip = false }: ProfileHeaderProps) {
  // xpMinimoDoNivel é a curva REAL (services/monolith/internal/gamification/algorithms.go
  // Nivel) — antes usava lib/api/mocks/fixtures/levelCurve.ts, uma curva de mock diferente
  // (calibrada só pra bater com um xp_total/level específico do fixture), que fazia essa barra
  // ficar sempre cheia com dado real (xpIntoLevel sempre > xpNeededForLevel).
  const currentLevelXp = xpMinimoDoNivel(level);
  const nextLevelXp = xpMinimoDoNivel(level + 1);
  const xpIntoLevel = Math.max(0, xpTotal - currentLevelXp);
  const xpNeededForLevel = nextLevelXp - currentLevelXp;

  return (
    <View style={styles.container}>
      <Avatar name={name} size={96} vip={vip} />
      <View style={styles.textBlock}>
        <View style={styles.nameRow}>
          <Text style={[type.headlineMd, vip ? styles.nameVip : styles.name]}>{name}</Text>
          {vip && <Icon name="crown" size={20} color={colors.secondary} />}
        </View>
        <Text style={[type.labelCaps, styles.subtitle]}>
          Nível {level} • {levelTitleFor(level)}
        </Text>
        {vip && (
          <Badge tone="gold" children="Mestre Arquiteto" />
        )}
        <ProgressBar value={xpIntoLevel} max={xpNeededForLevel} variant="thin" tone="secondary" style={styles.progress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 12,
  },
  textBlock: {
    width: "100%",
    maxWidth: 256,
    alignItems: "center",
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  nameVip: {
    color: colors.secondary,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  progress: {
    marginTop: 8,
  },
});
