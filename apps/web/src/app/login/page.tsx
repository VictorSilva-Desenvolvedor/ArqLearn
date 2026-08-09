"use client";

import { useContext, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/contexts/AuthContext";
import { mockAccounts } from "@/lib/api/mocks/fixtures/accounts";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { AccountCard } from "@/components/features/auth/AccountCard";

export default function LoginPage() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const message = await auth?.loginWithPassword(email, password);
    setSubmitting(false);
    if (message) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    router.push("/");
  };

  const handleSelectMockAccount = (accountId: (typeof mockAccounts)[number]["id"], landingPath: string) => {
    auth?.switchAccount(accountId);
    router.push(landingPath);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-lg px-md py-section bg-background">
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
      </form>

      <div className="flex items-center gap-sm w-full max-w-[26rem]">
        <div className="h-px flex-1 bg-outline-variant" />
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          modo demonstração
        </span>
        <div className="h-px flex-1 bg-outline-variant" />
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant text-center max-w-[26rem]">
        Professor e administrador ainda não têm conta real — escolha uma conta de demonstração
        para ver essas telas.
      </p>
      <div className="flex flex-col gap-sm w-full max-w-[26rem]">
        {mockAccounts
          .filter((account) => account.user.role !== "student")
          .map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onSelect={() => handleSelectMockAccount(account.id, account.landingPath)}
            />
          ))}
      </div>
    </div>
  );
}
