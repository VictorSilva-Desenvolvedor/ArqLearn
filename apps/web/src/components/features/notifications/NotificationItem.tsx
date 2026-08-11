import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import type { AppNotification, NotificationType } from "@/types/api";

const typeConfig: Record<NotificationType, { icon: string; className: string }> = {
  streak_at_risk: { icon: "local_fire_department", className: "text-error-red" },
  league_promotion: { icon: "military_tech", className: "text-primary" },
  league_demotion: { icon: "trending_down", className: "text-error-red" },
  new_challenge: { icon: "bolt", className: "text-secondary" },
  questions_ready_for_review: { icon: "fact_check", className: "text-tertiary" },
  welcome: { icon: "architecture", className: "text-on-surface-variant" },
  bug_fixed: { icon: "bug_report", className: "text-tertiary" },
  suggestion_implemented: { icon: "lightbulb", className: "text-secondary" },
};

interface NotificationItemProps {
  notification: AppNotification;
  // Só streak_at_risk tem destino definido pelo spec ("deep-link direto pra lição sugerida") —
  // os outros tipos não têm um alvo especificado, então continuam não-clicáveis.
  href?: string;
}

export function NotificationItem({ notification, href }: NotificationItemProps) {
  const config = typeConfig[notification.type];
  const isHighlighted = notification.type === "league_promotion" && !notification.read;

  const cardClassName = cn(
    "flex items-center gap-sm",
    isHighlighted && "border-primary bg-primary-fixed",
    notification.read && "opacity-60",
  );

  const content = (
    <>
      <Icon name={config.icon} filled className={cn("text-2xl", config.className)} />
      <p className="flex-1 font-body-md text-body-md text-on-surface">{notification.message}</p>
      {!notification.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <Card padding="sm" radius="md" interactive className={cardClassName}>
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card padding="sm" radius="md" className={cardClassName}>
      {content}
    </Card>
  );
}
