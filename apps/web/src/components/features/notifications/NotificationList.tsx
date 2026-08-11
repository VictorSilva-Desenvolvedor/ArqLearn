import { NotificationItem } from "./NotificationItem";
import type { AppNotification } from "@/types/api";

interface NotificationListProps {
  notifications: AppNotification[];
  // Deep-link pra lição sugerida — só se aplica a notificações do tipo streak_at_risk.
  currentLessonHref?: string | null;
}

export function NotificationList({ notifications, currentLessonHref }: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-lg">
        Nenhuma notificação por enquanto.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          href={notification.type === "streak_at_risk" ? (currentLessonHref ?? undefined) : undefined}
        />
      ))}
    </div>
  );
}
