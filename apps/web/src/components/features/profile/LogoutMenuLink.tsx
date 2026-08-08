"use client";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";

export function LogoutMenuLink() {
  const { logout } = useAuth();

  return (
    <Card
      padding="md"
      radius="lg"
      interactive
      onClick={logout}
      className="flex items-center gap-sm cursor-pointer"
    >
      <Icon name="logout" className="text-2xl text-error" />
      <span className="flex-1 font-body-lg text-body-lg text-error">Sair</span>
    </Card>
  );
}
