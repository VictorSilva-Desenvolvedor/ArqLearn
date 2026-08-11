import { listNotifications } from "@/lib/api/resources/notifications";
import { NotificationList } from "@/components/features/notifications/NotificationList";
import { NotificationPreferencesPanel } from "@/components/features/notifications/NotificationPreferencesPanel";
import { findCurrentLessonHref } from "@/lib/gamification/currentLesson";
import { getServerAccessToken } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const accessToken = await getServerAccessToken();
  const { data: notifications } = await listNotifications(accessToken);
  const hasStreakAlert = notifications.some((n) => n.type === "streak_at_risk");
  const currentLessonHref = hasStreakAlert ? await findCurrentLessonHref(accessToken) : null;

  return (
    <div className="max-w-2xl mx-auto px-lg py-section flex flex-col gap-md">
      <h1 className="font-display text-display-lg font-bold text-on-surface">Notificações</h1>
      <NotificationPreferencesPanel />
      <NotificationList notifications={notifications} currentLessonHref={currentLessonHref} />
    </div>
  );
}
