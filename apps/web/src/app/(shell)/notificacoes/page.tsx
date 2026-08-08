import { listNotifications } from "@/lib/api/resources/notifications";
import { NotificationList } from "@/components/features/notifications/NotificationList";

export default async function NotificationsPage() {
  const { data: notifications } = await listNotifications();

  return (
    <div className="max-w-2xl mx-auto px-lg py-section flex flex-col gap-md">
      <h1 className="font-display text-display-lg font-bold text-on-surface">Notificações</h1>
      <NotificationList notifications={notifications} />
    </div>
  );
}
