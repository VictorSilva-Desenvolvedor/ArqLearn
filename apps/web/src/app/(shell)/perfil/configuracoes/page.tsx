"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { updateMe, deleteMe, exportMyData } from "@/lib/api/resources/profile";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";
import { Modal, ModalTitle, ModalDescription } from "@/components/ui/Modal";
import { NotificationPreferencesPanel } from "@/components/features/notifications/NotificationPreferencesPanel";
import { ThemeSelector } from "@/components/layout/ThemeSelector";

const MIN_PASSWORD_LENGTH = 6;

// Tempo que o usuário precisa segurar o botão pra confirmar a exclusão — de propósito longo o
// suficiente pra não ser um clique acidental (pedido explícito: fricção alta numa ação
// irreversível de dados).
const HOLD_TO_CONFIRM_MS = 10_000;

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();

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
  // P2 do /impeccable critique (18/08/2026): mesmo achado do redefinir-senha/page.tsx.
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

  const startHold = () => {
    if (!phraseConfirmed || deleting) return;
    const startedAt = Date.now();
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(100, (elapsed / HOLD_TO_CONFIRM_MS) * 100);
      setHoldProgress(progress);
      if (elapsed >= HOLD_TO_CONFIRM_MS) {
        stopHold(false);
        handleDelete();
      }
    }, 50);
  };

  const resetDeleteConfirmation = () => {
    stopHold(true);
    setConfirmPhraseInput("");
  };

  // Segurar o botão e sair da aba/fechar sem soltar não pode deixar o timer rodando em segundo
  // plano — limpa o interval se o componente desmontar no meio da contagem.
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { deletion_scheduled_at } = await deleteMe();
      setDeletionScheduledAt(deletion_scheduled_at);
    } catch {
      setHoldProgress(0);
    } finally {
      setDeleting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordValid || changingPassword) return;
    setChangingPassword(true);
    setPasswordError(null);
    setPasswordChanged(false);
    try {
      const { error } = await createClient().auth.updateUser({ password: newPassword });
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

  // Blob + link temporário com `download` — padrão de browser pra disparar um download sem
  // precisar de backend servindo o arquivo como estático.
  const handleExportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await exportMyData(user);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "arqlearn-meus-dados.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      showToast("Não foi possível exportar seus dados agora.", "error");
    } finally {
      setExporting(false);
    }
  };

  if (deletionScheduledAt) {
    const formattedDate = new Date(deletionScheduledAt).toLocaleDateString("pt-BR");
    return (
      <div className="max-w-2xl mx-auto px-lg py-section flex flex-col items-center text-center gap-md">
        <Icon name="event_busy" className="text-5xl text-error" />
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface">
            Exclusão de conta agendada
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Sua conta será excluída em <strong>{formattedDate}</strong>. Até lá, você pode entrar
            novamente para cancelar.
          </p>
        </div>
        <Button variant="primary" onClick={logout}>
          Sair agora
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-lg py-section flex flex-col gap-lg">
      <div className="flex items-center gap-sm">
        <IconButton icon={<Icon name="arrow_back" />} label="Voltar" onClick={() => router.back()} />
        <h1 className="font-display text-display-lg font-bold text-on-surface">Configurações</h1>
      </div>

      <Card padding="lg" radius="lg" className="flex flex-col gap-md">
        <h2 className="font-display text-headline-md text-on-surface">Perfil</h2>

        <label className="flex flex-col gap-1">
          <span className="font-label text-label-caps uppercase text-on-surface-variant">Nome</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-surface-gray border-2 border-outline-variant rounded-lg px-sm py-2 font-body-lg text-body-lg text-on-surface outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-label text-label-caps uppercase text-on-surface-variant">
            Fuso horário
          </span>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="bg-surface-gray border-2 border-outline-variant rounded-lg px-sm py-2 font-body-lg text-body-lg text-on-surface outline-none focus:border-primary"
          />
        </label>

        <p className="font-body-sm text-body-sm text-on-surface-variant">{user.email}</p>

        <div className="flex items-center gap-sm">
          <Button variant="primary" disabled={!dirty || saving} onClick={handleSave}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </Button>
          {saved && !dirty && (
            <span className="flex items-center gap-1 font-body-sm text-body-sm text-tertiary">
              <Icon name="check_circle" filled />
              Salvo
            </span>
          )}
        </div>
      </Card>

      <Card padding="lg" radius="lg" className="flex flex-col gap-md">
        <h2 className="font-display text-headline-md text-on-surface">Trilha de estudo</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Qual assunto você está estudando agora.</p>
        <ThemeSelector />
      </Card>

      <NotificationPreferencesPanel />

      <Card padding="lg" radius="lg" className="flex flex-col gap-md">
        <h2 className="font-display text-headline-md text-on-surface">Segurança</h2>

        <label className="flex flex-col gap-1">
          <span className="font-label text-label-caps uppercase text-on-surface-variant">Nova senha</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            placeholder={`Pelo menos ${MIN_PASSWORD_LENGTH} caracteres`}
            className="bg-surface-gray border-2 border-outline-variant rounded-lg px-sm py-2 font-body-lg text-body-lg text-on-surface outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-label text-label-caps uppercase text-on-surface-variant">
            Confirmar nova senha
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="bg-surface-gray border-2 border-outline-variant rounded-lg px-sm py-2 font-body-lg text-body-lg text-on-surface outline-none focus:border-primary"
          />
        </label>

        {passwordHint && <p className="font-body-sm text-body-sm text-on-surface-variant">{passwordHint}</p>}
        {passwordError && <p className="font-body-sm text-body-sm text-error">{passwordError}</p>}
        {passwordChanged && <p className="font-body-sm text-body-sm text-tertiary">Senha alterada com sucesso!</p>}

        <div>
          <Button variant="primary" disabled={!passwordValid || changingPassword} onClick={handleChangePassword}>
            {changingPassword ? "Alterando…" : "Alterar senha"}
          </Button>
        </div>
      </Card>

      <Card padding="lg" radius="lg" className="flex flex-col gap-sm">
        <h2 className="font-display text-headline-md text-on-surface">Seus dados</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Baixe uma cópia de tudo que guardamos sobre sua conta — perfil, XP, conquistas e progresso
          (LGPD, direito de portabilidade de dados).
        </p>
        <div>
          <Button variant="ghost" disabled={exporting} onClick={handleExportData}>
            {exporting ? "Exportando…" : "Exportar meus dados"}
          </Button>
        </div>
      </Card>

      <Card padding="lg" radius="lg" className="flex flex-col gap-sm">
        <h2 className="font-display text-headline-md text-on-surface">Sessão</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Sair da sua conta neste dispositivo.
        </p>
        <div>
          <Button variant="ghost" onClick={logout}>
            Sair da conta
          </Button>
        </div>
      </Card>

      <Card padding="lg" radius="lg" className="flex flex-col gap-sm border-error">
        <h2 className="font-display text-headline-md text-error">Zona de risco</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Excluir sua conta apaga seu progresso, XP e conquistas. Você tem 30 dias para cancelar
          antes da exclusão definitiva.
        </p>
        <div>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Excluir conta
          </Button>
        </div>
      </Card>

      <Modal
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) resetDeleteConfirmation();
        }}
        dismissible={!holding}
      >
        <div className="flex flex-col gap-md">
          <ModalTitle className="font-display text-headline-md font-bold text-on-surface">
            Tem certeza?
          </ModalTitle>
          <ModalDescription className="font-body-md text-body-md text-on-surface-variant">
            Essa ação agenda a exclusão da sua conta ArqLearn e de todo o seu progresso. Você pode
            cancelar entrando de novo dentro de 30 dias.
          </ModalDescription>

          <label className="flex flex-col gap-1">
            <span className="font-body-sm text-body-sm text-error font-bold">
              Pra confirmar, digite: &quot;{requiredPhrase}&quot;
            </span>
            <input
              type="text"
              value={confirmPhraseInput}
              onChange={(e) => setConfirmPhraseInput(e.target.value)}
              disabled={holding || deleting}
              autoComplete="off"
              spellCheck={false}
              placeholder={requiredPhrase}
              className="bg-surface-gray border-2 border-error rounded-lg px-sm py-2 font-body-lg text-body-lg text-error placeholder:text-error/40 outline-none focus:border-error disabled:opacity-60"
            />
          </label>

          <div className="flex gap-sm justify-end items-center">
            <Button variant="ghost" disabled={holding} onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={!phraseConfirmed || deleting}
              onPointerDown={startHold}
              onPointerUp={() => stopHold(true)}
              onPointerLeave={() => stopHold(true)}
              onPointerCancel={() => stopHold(true)}
              // P1 do /impeccable critique (18/08/2026): só ponteiro deixava o botão inoperável
              // pra quem navega só por teclado — Enter/Espaço focados não faziam nada. `repeat`
              // ignorado pra não reiniciar a contagem a cada auto-repeat do SO enquanto segura.
              onKeyDown={(e) => {
                if ((e.key === " " || e.key === "Enter") && !e.repeat) startHold();
              }}
              onKeyUp={(e) => {
                if (e.key === " " || e.key === "Enter") stopHold(true);
              }}
              className="relative overflow-hidden select-none"
            >
              {holdProgress > 0 && (
                <span
                  className="absolute inset-y-0 left-0 bg-on-error/25 pointer-events-none"
                  style={{ width: `${holdProgress}%` }}
                />
              )}
              <span className="relative">
                {deleting
                  ? "Excluindo…"
                  : holding
                    ? `Segure… ${Math.ceil((HOLD_TO_CONFIRM_MS * (1 - holdProgress / 100)) / 1000)}s`
                    : "Segure 10s para excluir"}
              </span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
