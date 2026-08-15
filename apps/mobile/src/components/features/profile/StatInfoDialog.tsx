import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { colors, spacing, type } from "@/theme/tokens";

type StatInfoTone = "primary" | "secondary" | "tertiary";

interface StatInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: IconName;
  tone?: StatInfoTone;
  title: string;
  description: string;
  footer?: ReactNode;
}

const toneColors: Record<StatInfoTone, { bg: string; fg: string }> = {
  primary: { bg: colors.primaryContainer, fg: colors.onPrimaryContainer },
  secondary: { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer },
  tertiary: { bg: colors.tertiaryContainer, fg: colors.onTertiaryContainer },
};

// Modal genérico pros StatCard de Perfil (XP Total, Trilhas Concluídas, Lições, Precisão) que
// antes só mostravam um toast — mesma casca visual do StreakDialog/NoHeartsDialog (ícone
// circular + título + descrição + botão "Entendi"), parametrizado pelo conteúdo de cada stat.
export function StatInfoDialog({ open, onOpenChange, icon, tone = "primary", title, description, footer }: StatInfoDialogProps) {
  const { bg, fg } = toneColors[tone];

  return (
    <Modal open={open} onOpenChange={onOpenChange} radius="full">
      <View style={styles.content}>
        <View style={[styles.iconBadge, { backgroundColor: bg }]}>
          <Icon name={icon} size={40} color={fg} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[type.headlineMd, styles.title]}>{title}</Text>
          <Text style={[type.bodyMd, styles.description]}>{description}</Text>
        </View>
        {footer}
        <Button variant="ghost" fullWidth onPress={() => onOpenChange(false)}>
          Entendi
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    gap: spacing.md,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignItems: "center",
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: 8,
  },
});
