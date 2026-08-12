import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ToastContext } from "@/contexts/ToastContext";
import { Icon } from "@/components/ui/Icon";
import { colors, type } from "@/theme/tokens";

// Montado uma vez no root layout (dentro do ToastProvider) — qualquer tela chama useToast() pra
// disparar. Espelha apps/web/src/components/ui/Toast.tsx; posicionamento fixo via View absoluta
// (sem portal — RN não tem DOM).
export function Toast() {
  const ctx = useContext(ToastContext);
  const toast = ctx?.toast ?? null;
  if (!toast) return null;

  const isSuccess = toast.tone === "success";

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.pill, { backgroundColor: isSuccess ? colors.tertiary : colors.error }]}>
        <Icon name={isSuccess ? "success" : "error"} size={18} color={isSuccess ? colors.onTertiary : colors.onError} />
        <Text style={[type.bodyMdBold, { color: isSuccess ? colors.onTertiary : colors.onError }]}>
          {toast.message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 96,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
