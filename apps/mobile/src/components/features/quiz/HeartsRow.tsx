import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { useColors } from "@/theme/useColors";

const MAX_HEARTS = 5;

interface HeartsRowProps {
  hearts: number;
}

// Espec ("Hearts"): 5 ícones individuais no cabeçalho da sessão, coração perdido vira contorno
// vazio em vez de sumir — não 1 ícone + contador numérico. Espelha
// apps/web/src/components/features/quiz/HeartsRow.tsx.
export function HeartsRow({ hearts }: HeartsRowProps) {
  const colors = useColors();
  return (
    <View
      style={styles.row}
      accessibilityRole="image"
      accessibilityLabel={`${hearts} de ${MAX_HEARTS} vidas restantes`}
    >
      {Array.from({ length: MAX_HEARTS }).map((_, i) => (
        <Icon
          key={i}
          name={i < hearts ? "hearts" : "heartOutline"}
          size={20}
          color={i < hearts ? colors.secondary : colors.outlineVariant}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
});
