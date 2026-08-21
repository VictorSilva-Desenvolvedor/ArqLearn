import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { NotificationPreferencesPanel } from "@/components/features/notifications/NotificationPreferencesPanel";
import { ThemeSelector } from "@/components/home/ThemeSelector";
import { Toggle } from "@/components/ui/Toggle";
import { useAppearance } from "@/hooks/useAppearance";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { deleteMe, exportMyData, updateMe } from "@/lib/api/resources/profile";
import { createSupabaseClient } from "@/lib/supabase/client";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

const MIN_PASSWORD_LENGTH = 6;

// Tempo que o usuário precisa segurar o botão pra confirmar a exclusão — de propósito longo o
// suficiente pra não ser um toque acidental (mesma fricção alta de
// apps/web/src/app/(shell)/perfil/configuracoes/page.tsx numa ação irreversível de dados).
const HOLD_TO_CONFIRM_MS = 10_000;

export default function ConfiguracoesScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();
  const { preference: appearance, setPreference: setAppearance } = useAppearance();

  const [name, setName] = useState(user.name);
  const [timezone, setTimezone] = useState(user.timezone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const passwordValid = newPassword.length >= MIN_PASSWORD_LENGTH && newPassword === confirmPassword;
  // Achado equivalente ao já corrigido no web (apps/web/.../perfil/configuracoes/page.tsx e
  // redefinir-senha/page.tsx): o botão só ficava desabilitado sem explicar por quê.
  const passwordHint =
    newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH
      ? `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
      : confirmPassword.length > 0 && newPassword !== confirmPassword
        ? "As senhas não coincidem."
        : null;

  const [exporting, setExporting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null);
  const [confirmPhraseInput, setConfirmPhraseInput] = useState("");
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // P0 do /impeccable audit (18/08/2026): o gesto de segurar 10s é estruturalmente incompatível
  // com TalkBack (que intercepta o toque pra navegação por exploração) — sem isto, quem usa
  // leitor de tela não tinha NENHUM caminho pra completar a exclusão de conta. Mesmo padrão de
  // detecção de useReduceMotion.ts.
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (mounted) setScreenReaderEnabled(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", setScreenReaderEnabled);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const dirty = name !== user.name || timezone !== user.timezone;

  // Exige o nome da conta na frase — não dá pra confirmar exclusão só copiando um texto fixo
  // sem prestar atenção em qual conta está sendo excluída.
  const requiredPhrase = `quero excluir a conta ${user.name}`;
  const phraseConfirmed = confirmPhraseInput.trim().toLowerCase() === requiredPhrase.toLowerCase();
  const holding = holdIntervalRef.current !== null;

  const stopHold = (reset: boolean) => {
    if (holdIntervalRef.current !== null) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (reset) setHoldProgress(0);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { deletion_scheduled_at } = await deleteMe();
      setDeletionScheduledAt(deletion_scheduled_at);
    } catch {
      // Achado do /impeccable critique (18/08/2026): antes disso a falha aqui era totalmente
      // silenciosa — nem toast, nem texto, nada, na ação mais irreversível do app.
      setHoldProgress(0);
      showToast("Não foi possível excluir sua conta agora. Tente de novo.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const startHold = () => {
    if (!phraseConfirmed || deleting) return;
    const startedAt = Date.now();
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(100, (elapsed / HOLD_TO_CONFIRM_MS) * 100);
      setHoldProgress(progress);
      if (elapsed >= HOLD_TO_CONFIRM_MS) {
        stopHold(false);
        void handleDelete();
      }
    }, 50);
  };

  const resetDeleteConfirmation = () => {
    stopHold(true);
    setConfirmPhraseInput("");
  };

  // Segurar o botão e sair da tela sem soltar não pode deixar o timer rodando em segundo plano
  // — limpa o interval se o componente desmontar no meio da contagem.
  useEffect(() => () => stopHold(true), []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateMe(user, { name, timezone });
      updateUser(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutNow = async () => {
    await logout();
    router.replace("/login");
  };

  const handleChangePassword = async () => {
    if (!passwordValid || changingPassword) return;
    setChangingPassword(true);
    setPasswordError(null);
    setPasswordChanged(false);
    try {
      const { error } = await createSupabaseClient().auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordChanged(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Não foi possível alterar a senha agora.");
    } finally {
      setChangingPassword(false);
    }
  };

  // Escreve o export num arquivo temporário (cache, não Documents — não precisa sobreviver ao
  // app fechar) e abre a folha de compartilhamento nativa, já que RN não tem "salvar em Downloads"
  // direto sem permissão extra — deixa o próprio usuário escolher onde salvar/enviar.
  const handleExportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await exportMyData(user);
      const fileUri = `${FileSystem.cacheDirectory}arqlearn-meus-dados.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2), { encoding: "utf8" });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: "application/json", dialogTitle: "Exportar meus dados" });
      } else {
        showToast("Exportação pronta, mas compartilhamento não está disponível neste dispositivo.", "error");
      }
    } catch {
      showToast("Não foi possível exportar seus dados agora.", "error");
    } finally {
      setExporting(false);
    }
  };

  if (deletionScheduledAt) {
    const formattedDate = new Date(deletionScheduledAt).toLocaleDateString("pt-BR");
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.deletionScheduled}>
          <Icon name="eventBusy" size={48} color={colors.error} />
          <Text style={[type.headlineMd, styles.deletionTitle]}>Exclusão de conta agendada</Text>
          <Text style={[type.bodyMd, styles.deletionCaption]}>
            Sua conta será excluída em <Text style={styles.bold}>{formattedDate}</Text>. Até lá, você
            pode entrar novamente para cancelar.
          </Text>
          <Button variant="primary" onPress={handleLogoutNow}>
            Sair agora
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconButton icon={<Icon name="back" size={22} color={colors.onSurface} />} label="Voltar" onPress={() => router.back()} />
          <Text style={[type.displayLg, styles.headerTitle]}>Configurações</Text>
        </View>

        <Card padding="lg" radius="lg" style={styles.card}>
          <Text style={[type.headlineMd, styles.cardTitle]}>Perfil</Text>

          <View style={styles.field}>
            <Text style={[type.labelCaps, styles.fieldLabel]}>Nome</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} accessibilityLabel="Nome" />
          </View>

          <View style={styles.field}>
            <Text style={[type.labelCaps, styles.fieldLabel]}>Fuso horário</Text>
            <TextInput
              style={styles.input}
              value={timezone}
              onChangeText={setTimezone}
              autoCapitalize="none"
              accessibilityLabel="Fuso horário"
            />
          </View>

          <Text style={[type.bodySm, styles.email]}>{user.email}</Text>

          <View style={styles.saveRow}>
            <Button variant="primary" disabled={!dirty || saving} onPress={handleSave}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </Button>
            {saved && !dirty && (
              <View style={styles.savedBadge}>
                <Icon name="success" size={18} color={colors.tertiary} />
                <Text style={[type.bodySm, styles.savedText]}>Salvo</Text>
              </View>
            )}
          </View>
        </Card>

        <Card padding="lg" radius="lg" style={styles.card}>
          <Text style={[type.headlineMd, styles.cardTitle]}>Aparência</Text>
          <Text style={[type.bodySm, styles.cardCaption]}>
            Tema escuro — desligado usa o tema claro, o padrão do app.
          </Text>
          <View style={styles.appearanceRow}>
            <Text style={[type.bodyLg, styles.appearanceLabel]}>Tema escuro</Text>
            <Toggle
              checked={appearance === "dark"}
              onChange={(checked) => setAppearance(checked ? "dark" : "light")}
              label="Tema escuro"
            />
          </View>
        </Card>

        <Card padding="lg" radius="lg" style={styles.card}>
          <Text style={[type.headlineMd, styles.cardTitle]}>Trilha de estudo</Text>
          <Text style={[type.bodySm, styles.cardCaption]}>Qual assunto você está estudando agora.</Text>
          <ThemeSelector />
        </Card>

        <NotificationPreferencesPanel />

        <Card padding="lg" radius="lg" style={styles.card}>
          <Text style={[type.headlineMd, styles.cardTitle]}>Segurança</Text>

          <View style={styles.field}>
            <Text style={[type.labelCaps, styles.fieldLabel]}>Nova senha</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder={`Pelo menos ${MIN_PASSWORD_LENGTH} caracteres`}
              placeholderTextColor={colors.onSurfaceVariant}
              accessibilityLabel="Nova senha"
            />
          </View>

          <View style={styles.field}>
            <Text style={[type.labelCaps, styles.fieldLabel]}>Confirmar nova senha</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              accessibilityLabel="Confirmar nova senha"
            />
          </View>

          {passwordHint && <Text style={[type.bodySm, styles.passwordHint]}>{passwordHint}</Text>}
          {passwordError && <Text style={[type.bodySm, styles.passwordError]}>{passwordError}</Text>}
          {passwordChanged && <Text style={[type.bodySm, styles.passwordSuccess]}>Senha alterada com sucesso!</Text>}

          <View style={styles.saveRow}>
            <Button variant="primary" disabled={!passwordValid || changingPassword} onPress={handleChangePassword}>
              {changingPassword ? "Alterando…" : "Alterar senha"}
            </Button>
          </View>
        </Card>

        <Card padding="lg" radius="lg" style={styles.card}>
          <Text style={[type.headlineMd, styles.cardTitle]}>Seus dados</Text>
          <Text style={[type.bodyMd, styles.cardCaption]}>
            Baixe uma cópia de tudo que guardamos sobre sua conta — perfil, XP, conquistas e progresso
            (LGPD, direito de portabilidade de dados).
          </Text>
          <View style={styles.saveRow}>
            <Button variant="ghost" disabled={exporting} onPress={handleExportData}>
              {exporting ? "Exportando…" : "Exportar meus dados"}
            </Button>
          </View>
        </Card>

        <Card padding="lg" radius="lg" style={styles.card}>
          <Text style={[type.headlineMd, styles.cardTitle]}>Sessão</Text>
          <Text style={[type.bodySm, styles.cardCaption]}>Sair da sua conta neste dispositivo.</Text>
          <View style={styles.saveRow}>
            <Button variant="ghost" onPress={handleLogoutNow}>
              Sair da conta
            </Button>
          </View>
        </Card>

        <Card padding="lg" radius="lg" style={[styles.card, styles.dangerCard]}>
          <Text style={[type.headlineMd, styles.dangerTitle]}>Zona de risco</Text>
          <Text style={[type.bodyMd, styles.dangerCaption]}>
            Excluir sua conta apaga seu progresso, XP e conquistas. Você tem 30 dias para cancelar
            antes da exclusão definitiva.
          </Text>
          <View style={styles.dangerAction}>
            <Button variant="danger" onPress={() => setDeleteOpen(true)}>
              Excluir conta
            </Button>
          </View>
        </Card>
      </ScrollView>

      <Modal
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) resetDeleteConfirmation();
        }}
        dismissible={!holding}
      >
        <View style={styles.modalContent}>
          <Text style={[type.headlineMd, styles.modalTitle]}>Tem certeza?</Text>
          <Text style={[type.bodyMd, styles.modalDescription]}>
            Essa ação agenda a exclusão da sua conta ArqLearn e de todo o seu progresso. Você pode
            cancelar entrando de novo dentro de 30 dias.
          </Text>

          <View style={styles.field}>
            <Text style={[type.bodySm, styles.modalFieldLabel]}>
              Pra confirmar, digite: &quot;{requiredPhrase}&quot;
            </Text>
            <TextInput
              style={styles.modalInput}
              value={confirmPhraseInput}
              onChangeText={setConfirmPhraseInput}
              editable={!holding && !deleting}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={requiredPhrase}
              placeholderTextColor={colors.error + "66"}
              accessibilityLabel={`Frase de confirmação: ${requiredPhrase}`}
            />
          </View>

          <View style={styles.modalActions}>
            <Button variant="ghost" disabled={holding} onPress={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            {screenReaderEnabled ? (
              // Alternativa acessível ao gesto de segurar — a frase já digitada acima é a
              // fricção deliberada aqui; um botão comum, ativável por toque duplo do TalkBack,
              // substitui o hold que ele não consegue completar.
              <Button variant="danger" disabled={!phraseConfirmed || deleting} onPress={() => void handleDelete()}>
                {deleting ? "Excluindo…" : "Excluir definitivamente"}
              </Button>
            ) : (
              <Pressable
                disabled={!phraseConfirmed || deleting}
                onPressIn={startHold}
                onPressOut={() => stopHold(true)}
                style={[styles.holdButton, (!phraseConfirmed || deleting) && styles.holdButtonDisabled]}
              >
                {holdProgress > 0 && <View style={[styles.holdProgress, { width: `${holdProgress}%` }]} />}
                <Text style={[type.bodyLg, styles.holdButtonLabel]}>
                  {deleting
                    ? "Excluindo…"
                    : holding
                      ? `Segure… ${Math.ceil((HOLD_TO_CONFIRM_MS * (1 - holdProgress / 100)) / 1000)}s`
                      : "Segure 10s para excluir"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    headerTitle: {
      color: colors.onSurface,
      fontWeight: "700",
    },
    card: {
      gap: spacing.sm,
    },
    cardTitle: {
      color: colors.onSurface,
    },
    cardCaption: {
      color: colors.onSurfaceVariant,
      marginBottom: spacing.sm,
    },
    appearanceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    appearanceLabel: {
      color: colors.onSurface,
    },
    passwordHint: {
      color: colors.onSurfaceVariant,
    },
    passwordError: {
      color: colors.error,
    },
    passwordSuccess: {
      color: colors.tertiary,
    },
    field: {
      gap: 4,
    },
    fieldLabel: {
      color: colors.onSurfaceVariant,
    },
    input: {
      borderWidth: 2,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surfaceGray,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.onSurface,
    },
    email: {
      color: colors.onSurfaceVariant,
    },
    saveRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    savedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    savedText: {
      color: colors.tertiary,
    },
    dangerCard: {
      borderColor: colors.error,
    },
    dangerTitle: {
      color: colors.error,
    },
    dangerCaption: {
      color: colors.onSurfaceVariant,
    },
    dangerAction: {
      alignItems: "flex-start",
    },
    deletionScheduled: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingHorizontal: 32,
    },
    deletionTitle: {
      color: colors.onSurface,
      textAlign: "center",
    },
    deletionCaption: {
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
    bold: {
      fontWeight: "700",
    },
    modalContent: {
      gap: spacing.md,
    },
    modalTitle: {
      color: colors.onSurface,
      fontWeight: "700",
    },
    modalDescription: {
      color: colors.onSurfaceVariant,
    },
    modalFieldLabel: {
      color: colors.error,
      fontWeight: "700",
    },
    modalInput: {
      borderWidth: 2,
      borderColor: colors.error,
      backgroundColor: colors.surfaceGray,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.error,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: spacing.sm,
    },
    holdButton: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 24,
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: colors.error,
      borderWidth: 2,
      borderColor: colors.error,
      alignItems: "center",
      justifyContent: "center",
    },
    holdButtonDisabled: {
      opacity: 0.5,
    },
    holdButtonLabel: {
      color: colors.onError,
      fontWeight: "700",
    },
    holdProgress: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: "rgba(255,255,255,0.25)",
    },
  });
