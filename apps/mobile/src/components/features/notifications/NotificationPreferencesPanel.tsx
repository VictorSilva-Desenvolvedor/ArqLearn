import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { updateNotificationPreferences } from "@/lib/api/resources/notifications";
import { colors, spacing, type } from "@/theme/tokens";

// Sem GET de preferências no contrato — só o PATCH. Começa com os dois canais habilitados
// (padrão razoável) e persiste a partir daí. Espelha
// apps/web/src/components/features/notifications/NotificationPreferencesPanel.tsx.
export function NotificationPreferencesPanel() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [saving, setSaving] = useState<"push" | "email" | null>(null);

  const handleToggle = async (channel: "push" | "email", value: boolean) => {
    setSaving(channel);
    if (channel === "push") setPushEnabled(value);
    else setEmailEnabled(value);
    try {
      await updateNotificationPreferences(channel === "push" ? { push_enabled: value } : { email_enabled: value });
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card padding="md" radius="lg" style={styles.card}>
      <Text style={[type.questionSm, styles.title]}>Preferências</Text>
      <View style={styles.row}>
        <Text style={[type.bodyMd, styles.label]}>Notificações push</Text>
        <Toggle checked={pushEnabled} disabled={saving === "push"} onChange={(value) => handleToggle("push", value)} label="Notificações push" />
      </View>
      <View style={styles.row}>
        <Text style={[type.bodyMd, styles.label]}>Notificações por e-mail</Text>
        <Toggle
          checked={emailEnabled}
          disabled={saving === "email"}
          onChange={(value) => handleToggle("email", value)}
          label="Notificações por e-mail"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  title: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: colors.onSurface,
  },
});
