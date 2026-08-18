"use client";

import { useContext, useState, type FormEvent } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const auth = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // P1 do /impeccable critique (18/08/2026): não existia NENHUM caminho de recuperação de
  // senha — usuário que esquecesse a senha ficava trancado fora da conta pra sempre.
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await auth?.loginWithPassword(email, password);
    setSubmitting(false);
    if (!result || result.error) {
      // Só traduz pro texto genérico quando o Supabase de fato disse "credenciais inválidas" —
      // qualquer outro erro (rate limit, rede, provedor fora do ar) aparece como veio, em vez de
      // ser escondido atrás da mesma mensagem, o que já disfarçou uma causa real diferente aqui.
      const raw = result?.error ?? "";
      setError(raw === "Invalid login credentials" || !raw ? "E-mail ou senha inválidos." : raw);
      return;
    }
    // Navegação forçada (não router.push) — o layout raiz (app/layout.tsx) só busca a sessão
    // real no servidor durante um carregamento completo de página; um router.push de cliente
    // reaproveita o cache de rotas do Next.js e o layout não re-executa com o cookie novo,
    // deixando useAuth() (TopAppBar etc.) explodir num user ainda null. Descoberto ao vivo — o
    // AuthProvider.initialMe corrigia só o primeiro carregamento, não o login em si.
    window.location.href = result.landingPath;
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setResetMessage("Digite seu e-mail no campo acima primeiro.");
      return;
    }
    setResetSubmitting(true);
    setResetMessage(null);
    // Não diferencia "e-mail existe" de "não existe" na mensagem — evita confirmar pra quem
    // está testando e-mails alheios se uma conta existe ou não.
    await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setResetSubmitting(false);
    setResetMessage("Se esse e-mail tiver uma conta, enviamos um link pra redefinir a senha.");
  };

  return (
    // Transparente de propósito (a pedido do usuário): deixa o fundo animado
    // (AnimatedBlueprintBackground, montado em app/layout.tsx) aparecer atrás — mesmo tratamento
    // de apps/mobile/src/app/login.tsx.
    <div className="min-h-screen flex flex-col items-center justify-center gap-lg px-md py-section">
      <div className="flex items-center gap-xs">
        <Icon name="architecture" filled className="text-primary text-display-lg" />
        <h1 className="font-display text-display-lg font-bold text-primary">ArqLearn</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-sm w-full max-w-[26rem]">
        <label className="flex flex-col gap-xs">
          <span className="font-label text-body-sm text-on-surface-variant">E-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border-2 border-outline-variant bg-surface px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none"
            placeholder="voce@exemplo.com"
          />
        </label>
        <label className="flex flex-col gap-xs">
          <span className="font-label text-body-sm text-on-surface-variant">Senha</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border-2 border-outline-variant bg-surface px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none"
            placeholder="••••••••"
          />
        </label>
        {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={resetSubmitting}
          className="font-body-sm text-body-sm text-primary hover:underline self-center disabled:opacity-50 py-3"
        >
          {resetSubmitting ? "Enviando…" : "Esqueci minha senha"}
        </button>
        {resetMessage && (
          <p role="status" className="font-body-sm text-body-sm text-on-surface-variant text-center">
            {resetMessage}
          </p>
        )}
      </form>
    </div>
  );
}
