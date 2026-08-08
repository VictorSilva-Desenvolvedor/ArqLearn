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
};

export function NotificationItem({ notification }: { notification: AppNotification }) {
  const config = typeConfig[notification.type];
  const isHighlighted = notification.type === "league_promotion" && !notification.read;

  return (
    <Card
      padding="sm"
      radius="md"
      className={cn(
        "flex items-center gap-sm",
        isHighlighted && "border-primary bg-primary-fixed",
        notification.read && "opacity-60",
      )}
    >
      <Icon name={config.icon} filled className={cn("text-2xl", config.className)} />
      <p className="flex-1 font-body-md text-body-md text-on-surface">{notification.message}</p>
      {!notification.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
    </Card>
  );
}
