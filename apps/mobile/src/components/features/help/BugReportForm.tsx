import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/lib/api/http";
import { submitBugReport } from "@/lib/api/resources/bugReports";
import { colors, spacing, type } from "@/theme/tokens";
import type { BugReportType, DeviceType } from "@/types/api";

const MIN_DESCRIPTION_LEN = 10;
const MAX_DESCRIPTION_LEN = 2000;
// Mesmo limite do backend (~2MB de imagem, API Spec §14) — validado aqui antes de tentar enviar,
// pra dar retorno imediato em vez de esperar o 413 do servidor.
const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;

const BUG_GEMS_REWARD = 10;
const SUGGESTION_GEMS_REWARD = 50;

const deviceTypeOptions: { value: DeviceType; label: string }[] = [
  { value: "mobile", label: "Celular" },
  { value: "desktop", label: "Computador" },
  { value: "tablet", label: "Tablet" },
];

interface Screenshot {
  uri: string;
  name: string;
  mimeType: string;
  base64: string;
}

// Espelha apps/web/src/components/features/help/BugReportForm.tsx — o `<input type="file">` +
// `FileReader.readAsDataURL` do web viram `expo-document-picker` (mesmo picker do fluxo de
// upload de material) + `expo-file-system/legacy` (`readAsStringAsync` com encoding base64; a
// API nova baseada em `File` não tem um método de ler base64 direto).
export function BugReportForm() {
  const [reportType, setReportType] = useState<BugReportType>("bug");
  const [description, setDescription] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceType, setDeviceType] = useState<DeviceType | "">("");
  const [screenshot, setScreenshot] = useState<Screenshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const isBug = reportType === "bug";
  const gemsReward = isBug ? BUG_GEMS_REWARD : SUGGESTION_GEMS_REWARD;

  const pickScreenshot = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "image/*", multiple: false });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;

    if (asset.size && asset.size > MAX_SCREENSHOT_BYTES) {
      setError("O print é grande demais — escolha uma imagem de até 2MB.");
      return;
    }
    setError(null);
    const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: "base64" });
    const mimeType = asset.mimeType ?? "image/jpeg";
    setScreenshot({ uri: asset.uri, name: asset.name, mimeType, base64: `data:${mimeType};base64,${base64}` });
  };

  const removeScreenshot = () => setScreenshot(null);

  const resetForm = () => {
    setDescription("");
    setDeviceModel("");
    setDeviceType("");
    removeScreenshot();
  };

  const handleSubmit = async () => {
    const trimmed = description.trim();
    if (trimmed.length < MIN_DESCRIPTION_LEN || trimmed.length > MAX_DESCRIPTION_LEN) {
      setError(`Descreva com pelo menos ${MIN_DESCRIPTION_LEN} caracteres (até ${MAX_DESCRIPTION_LEN}).`);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await submitBugReport({
        type: reportType,
        description: trimmed,
        screenshot_base64: screenshot?.base64 ?? null,
        device_model: isBug && deviceModel.trim() ? deviceModel.trim() : null,
        device_type: isBug && deviceType ? deviceType : null,
      });
      setSent(true);
      resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar agora — tente de novo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Card padding="lg" radius="lg" style={styles.sentCard}>
        <Icon name="success" size={48} color={colors.tertiary} />
        <Text style={[type.questionSm, styles.sentTitle]}>{isBug ? "Relato enviado!" : "Sugestão enviada!"}</Text>
        <Text style={[type.bodySm, styles.sentDescription]}>
          {isBug
            ? `Obrigado por ajudar a melhorar o ArqLearn. Se esse bug for corrigido, você ganha ${BUG_GEMS_REWARD} gemas e a gente te avisa por notificação.`
            : `Obrigado pela ideia! Se ela for implementada, você ganha ${SUGGESTION_GEMS_REWARD} gemas e a gente te avisa por notificação.`}
        </Text>
        <Button variant="ghost" onPress={() => setSent(false)}>
          Enviar outro
        </Button>
      </Card>
    );
  }

  return (
    <Card padding="lg" radius="lg" style={styles.card}>
      <View style={styles.typeRow}>
        <View style={styles.typeRowItem}>
          <Button variant={isBug ? "primary" : "ghost"} fullWidth onPress={() => setReportType("bug")}>
            Reportar bug
          </Button>
        </View>
        <View style={styles.typeRowItem}>
          <Button variant={!isBug ? "primary" : "ghost"} fullWidth onPress={() => setReportType("suggestion")}>
            Sugerir melhoria
          </Button>
        </View>
      </View>

      <View>
        <Text style={[type.questionSm, styles.promptTitle]}>{isBug ? "O que deu errado?" : "O que você melhoraria?"}</Text>
        <Text style={[type.bodySm, styles.promptCaption]}>
          {isBug
            ? `Descreva o problema e, se puder, anexe um print. Se corrigirmos, você ganha ${gemsReward} gemas.`
            : `Descreva sua ideia. Se a gente implementar, você ganha ${gemsReward} gemas.`}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={[type.bodySm, styles.fieldLabel]}>{isBug ? "O que aconteceu?" : "Sua sugestão"}</Text>
        <TextInput
          multiline
          numberOfLines={5}
          value={description}
          onChangeText={(text) => setDescription(text.slice(0, MAX_DESCRIPTION_LEN))}
          placeholder={
            isBug
              ? "Ex.: Ao tocar em \"Continuar\" no Modo Infinito de Maquetes, a tela travou."
              : "Ex.: Seria ótimo poder filtrar as lições por dificuldade antes de começar uma trilha."
          }
          placeholderTextColor={colors.outline}
          accessibilityLabel={isBug ? "O que aconteceu?" : "Sua sugestão"}
          style={styles.textarea}
        />
        <Text style={[type.bodySm, styles.counter]}>
          {description.length}/{MAX_DESCRIPTION_LEN}
        </Text>
      </View>

      {isBug && (
        <View style={styles.field}>
          <Text style={[type.bodySm, styles.fieldLabel]}>Tipo de dispositivo (opcional)</Text>
          <View style={styles.chipRow}>
            {deviceTypeOptions.map((opt) => {
              const active = deviceType === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setDeviceType(active ? "" : opt.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[type.bodySm, active ? styles.chipTextActive : styles.chipText]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {isBug && (
        <View style={styles.field}>
          <Text style={[type.bodySm, styles.fieldLabel]}>Modelo do dispositivo (opcional)</Text>
          <TextInput
            value={deviceModel}
            onChangeText={setDeviceModel}
            placeholder="Ex.: iPhone 13, Galaxy S23…"
            placeholderTextColor={colors.outline}
            accessibilityLabel="Modelo do dispositivo"
            style={styles.input}
          />
        </View>
      )}

      {isBug && (
        <View style={styles.field}>
          <Text style={[type.bodySm, styles.fieldLabel]}>Print (opcional, até 2MB)</Text>
          <Button variant="ghost" onPress={pickScreenshot}>
            {screenshot ? "Trocar print" : "Anexar print"}
          </Button>
        </View>
      )}

      {screenshot && (
        <View style={styles.screenshotRow}>
          <Image
            source={{ uri: screenshot.uri }}
            accessibilityLabel="Prévia do print anexado"
            style={styles.screenshotThumb}
          />
          <Text style={[type.bodySm, styles.screenshotName]} numberOfLines={1}>
            {screenshot.name}
          </Text>
          <Button variant="ghost" size="sm" onPress={removeScreenshot}>
            Remover
          </Button>
        </View>
      )}

      {error && <Text style={[type.bodySm, styles.error]}>{error}</Text>}

      <Button fullWidth disabled={submitting} onPress={handleSubmit}>
        {submitting ? "Enviando…" : isBug ? "Enviar relato" : "Enviar sugestão"}
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  typeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  typeRowItem: {
    flex: 1,
  },
  promptTitle: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  promptCaption: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    color: colors.onSurfaceVariant,
  },
  textarea: {
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.onSurface,
    minHeight: 100,
    textAlignVertical: "top",
  },
  input: {
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.onSurface,
  },
  counter: {
    color: colors.onSurfaceVariant,
    alignSelf: "flex-end",
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  chipText: {
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  screenshotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceGray,
    borderRadius: 12,
    padding: spacing.sm,
  },
  screenshotThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  screenshotName: {
    flex: 1,
    color: colors.onSurfaceVariant,
  },
  error: {
    color: colors.error,
    backgroundColor: colors.errorContainer,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sentCard: {
    alignItems: "center",
    gap: spacing.sm,
  },
  sentTitle: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  sentDescription: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
});
