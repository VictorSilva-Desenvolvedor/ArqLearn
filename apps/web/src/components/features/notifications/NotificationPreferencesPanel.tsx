"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { updateNotificationPreferences } from "@/lib/api/resources/notifications";

// Sem GET de preferências no contrato — só o PATCH. Começa com os dois canais habilitados
// (padrão razoável) e persiste a partir daí.
export function NotificationPreferencesPanel() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [saving, setSaving] = useState<"push" | "email" | null>(null);

  const handleToggle = async (channel: "push" | "email", value: boolean) => {
    setSaving(channel);
    if (channel === "push") setPushEnabled(value);
    else setEmailEnabled(value);
    try {
      await updateNotificationPreferences(
        channel === "push" ? { push_enabled: value } : { email_enabled: value },
      );
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card padding="md" radius="lg" className="flex flex-col gap-sm">
      <h2 className="font-display text-question-sm text-on-surface font-bold">Preferências</h2>
      <div className="flex items-center justify-between">
        <span className="font-body-md text-body-md text-on-surface">Notificações push</span>
        <Toggle
          checked={pushEnabled}
          disabled={saving === "push"}
          onChange={(value) => handleToggle("push", value)}
          label="Notificações push"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-body-md text-body-md text-on-surface">Notificações por e-mail</span>
        <Toggle
          checked={emailEnabled}
          disabled={saving === "email"}
          onChange={(value) => handleToggle("email", value)}
          label="Notificações por e-mail"
        />
      </div>
    </Card>
  );
}
