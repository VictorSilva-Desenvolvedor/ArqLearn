import { StyleSheet, Text, View } from "react-native";
import { PersonalRecordCard } from "./PersonalRecordCard";
import { type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { PersonalRecord } from "@/types/api";

// Espelha apps/web/src/components/features/profile/PersonalRecordsGrid.tsx (grid de 4 colunas via
// flexbox — RN não tem CSS grid; sempre 4 registros, sem necessidade de quebra em linhas como
// AchievementGrid, que tem dezenas de entradas).
export function PersonalRecordsGrid({ records }: { records: PersonalRecord[] }) {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <View>
      <Text style={[type.headlineMd, styles.title]}>Recordes Pessoais</Text>
      <View style={styles.row}>
        {records.map((record) => (
          <PersonalRecordCard key={record.metric} record={record} />
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    title: {
      color: colors.onSurface,
      fontWeight: "700",
      marginBottom: 8,
    },
    row: {
      flexDirection: "row",
      gap: 8,
    },
  });
