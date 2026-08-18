"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

const MIN_PASSWORD_LENGTH = 6;

type Status = "checking" | "ready" | "invalid-link" | "done";

// Destino do redirectTo em login/page.tsx (handleForgotPassword). O token de recuperação chega
// num fragmento de URL (#access_token=...&type=recovery) que só o cliente Supabase processa — o
// supabase-js detecta isso sozinho ao montar (detectSessionInUrl, padrão) e dispara o evento
// PASSWORD_RECOVERY abaixo. Exempto de auth no proxy.ts e no AuthContext pelo mesmo motivo que
// /login: o servidor nunca vê esse fragmento, então não pode decidir se a rota é "autenticada".
export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordValid = newPassword.length >= MIN_PASSWORD_LENGTH && newPassword === confirmPassword;

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus("ready");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setStatus("ready");
    });

    // Link inválido/expirado nunca dispara nenhum dos dois acima — depois de um tempo razoável
    // sem sessão, para de mostrar "verificando" e explica o problema em vez de girar pra sempre.
    const timeout = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "invalid-link" : current));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordValid) return;
    setSubmitting(true);
    setError(null);
    const { error: updateError } = await createClient().auth.updateUser({ password: newPassword });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setStatus("done");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-lg px-md py-section">
      <div className="flex items-center gap-xs">
        <Icon name="architecture" filled className="text-primary text-display-lg" />
        <h1 className="font-display text-display-lg font-bold text-primary">ArqLearn</h1>
      </div>

      {status === "checking" && (
        <p className="font-body-md text-body-md text-on-surface-variant">Verificando seu link…</p>
      )}

      {status === "invalid-link" && (
        <div className="flex flex-col items-center gap-sm text-center max-w-[26rem]">
          <p className="font-body-md text-body-md text-on-surface">
            Este link de redefinição não é válido ou já expirou.
          </p>
          <a href="/login" className="font-body-sm text-body-sm text-primary hover:underline">
            Voltar ao login pra pedir um novo
          </a>
        </div>
      )}

      {status === "ready" && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-sm w-full max-w-[26rem]">
          <label className="flex flex-col gap-xs">
            <span className="font-label text-body-sm text-on-surface-variant">Nova senha</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={`Pelo menos ${MIN_PASSWORD_LENGTH} caracteres`}
              className="rounded-xl border-2 border-outline-variant bg-surface px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label text-body-sm text-on-surface-variant">Confirmar nova senha</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-xl border-2 border-outline-variant bg-surface px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </label>
          {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
          <Button type="submit" fullWidth disabled={!passwordValid || submitting}>
            {submitting ? "Salvando…" : "Redefinir senha"}
          </Button>
        </form>
      )}

      {status === "done" && (
        <div className="flex flex-col items-center gap-sm text-center max-w-[26rem]">
          <p className="font-body-md text-body-md text-on-surface">Senha redefinida com sucesso!</p>
          <a href="/login" className="font-body-sm text-body-sm text-primary hover:underline">
            Entrar com a nova senha
          </a>
        </div>
      )}
    </div>
  );
}
