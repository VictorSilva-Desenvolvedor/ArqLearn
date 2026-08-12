import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/ui/Icon";
import { colors } from "@/theme/tokens";

export type LessonNodeVariant = "completed" | "current" | "locked" | "checkpoint" | "foggy";

interface LessonNodeProps {
  variant: Exclude<LessonNodeVariant, "current">;
  icon: IconName;
  href: string;
}

export function LessonNode({ variant, icon, href }: LessonNodeProps) {
  const router = useRouter();

  if (variant === "checkpoint") {
    return (
      <Pressable onPress={() => router.push(href as never)} style={styles.checkpointOuter}>
        <View style={styles.checkpointIcon}>
          <Icon name={icon} size={32} color={colors.onPrimary} />
        </View>
      </Pressable>
    );
  }

  if (variant === "completed") {
    return (
      <Pressable onPress={() => router.push(href as never)} style={styles.completed}>
        <Icon name={icon} size={28} color={colors.onPrimary} />
      </Pressable>
    );
  }

  if (variant === "foggy") {
    return (
      <View
        style={styles.foggy}
        accessibilityState={{ disabled: true }}
        accessibilityLabel="Missão ainda encoberta pela névoa"
      >
        <Icon name="foggy" size={28} color={colors.outline} />
      </View>
    );
  }

  return (
    <View style={styles.locked}>
      <Icon name={icon} size={28} color={colors.outline} />
    </View>
  );
}

const styles = StyleSheet.create({
  checkpointOuter: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  checkpointIcon: {
    transform: [{ rotate: "-45deg" }],
  },
  completed: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  locked: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceGray,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  foggy: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(243, 244, 246, 0.7)",
    borderWidth: 2,
    borderColor: "rgba(194, 199, 208, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
