import { StyleSheet, TextInput, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

// Espelha apps/web/src/components/features/explore/SearchBar.tsx.
export function SearchBar({ value, onChange }: SearchBarProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.bar}>
      <Icon name="search" size={20} color={colors.onSurfaceVariant} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Pesquisar trilhas, tópicos ou materiais..."
        placeholderTextColor={colors.onSurfaceVariant}
        accessibilityLabel="Pesquisar trilhas, tópicos ou materiais"
        style={[type.bodyLg, styles.input]}
      />
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surfaceGray,
      borderWidth: 2,
      borderColor: colors.outlineVariant,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    input: {
      flex: 1,
      color: colors.onSurface,
      padding: 0,
    },
  });
