import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { MockAccount } from "@/lib/api/mocks/fixtures/accounts";

const roleLabel = { student: "Aluno", teacher: "Professor", admin: "Administrador" } as const;
const roleTone = { student: "primary", teacher: "secondary", admin: "error" } as const;

interface AccountCardProps {
  account: MockAccount;
  onSelect: () => void;
}

export function AccountCard({ account, onSelect }: AccountCardProps) {
  return (
    <Card
      padding="md"
      radius="lg"
      interactive
      onClick={onSelect}
      className="flex items-center gap-sm cursor-pointer text-left w-full"
    >
      <Avatar name={account.user.name} size={40} />
      <div className="flex-1 min-w-0">
        <p className="font-body-lg text-body-lg font-bold text-on-surface truncate">{account.user.name}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{account.user.email}</p>
      </div>
      <Badge tone={roleTone[account.user.role as keyof typeof roleTone]}>
        {roleLabel[account.user.role as keyof typeof roleLabel]}
      </Badge>
    </Card>
  );
}
