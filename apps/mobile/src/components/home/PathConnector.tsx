import { StyleSheet, View } from "react-native";
import { useColors } from "@/theme/useColors";

interface PathConnectorProps {
  dashed?: boolean;
}

export function PathConnector({ dashed = false }: PathConnectorProps) {
  const colors = useColors();
  return (
    <View
      pointerEvents="none"
      style={[
        styles.base,
        dashed
          ? { borderLeftWidth: 2, borderLeftColor: colors.primary, borderStyle: "dashed" }
          : { backgroundColor: colors.primary },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    zIndex: 0,
  },
});
