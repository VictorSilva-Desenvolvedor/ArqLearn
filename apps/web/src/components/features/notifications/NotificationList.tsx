import { NotificationItem } from "./NotificationItem";
import type { AppNotification } from "@/types/api";

export function NotificationList({ notifications }: { notifications: AppNotification[] }) {
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
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
