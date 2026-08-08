"use client";

import { useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/contexts/AuthContext";
import { mockAccounts } from "@/lib/api/mocks/fixtures/accounts";
import { Icon } from "@/components/ui/Icon";
import { AccountCard } from "@/components/features/auth/AccountCard";

export default function LoginPage() {
  const router = useRouter();
  const auth = useContext(AuthContext);

  const handleSelect = (accountId: (typeof mockAccounts)[number]["id"], landingPath: string) => {
    auth?.switchAccount(accountId);
    router.push(landingPath);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-lg px-md py-section bg-background">
      <div className="flex items-center gap-xs">
        <Icon name="architecture" filled className="text-primary text-display-lg" />
        <h1 className="font-display text-display-lg font-bold text-primary">ArqLearn</h1>
      </div>
      <p className="font-body-lg text-body-lg text-on-surface-variant text-center">
        Escolha uma conta para entrar
      </p>
      <div className="flex flex-col gap-sm w-full max-w-[26rem]">
        {mockAccounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onSelect={() => handleSelect(account.id, account.landingPath)}
          />
        ))}
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant text-center max-w-[26rem]">
        Login mockado para demonstração — sem senha, sem Supabase nesta fase.
      </p>
    </div>
  );
}
