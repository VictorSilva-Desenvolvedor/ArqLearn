import { getServerAccessToken } from "@/lib/supabase/server";
import { getMe } from "@/lib/api/resources/users";
import { getGamificationProfile } from "@/lib/api/resources/gamification";
import { getProgressSummary } from "@/lib/api/resources/progress";
import { ProfileHeader } from "@/components/features/profile/ProfileHeader";
import { ProfileStatsGrid } from "@/components/features/profile/ProfileStatsGrid";
import { ProgressSummaryCard } from "@/components/features/profile/ProgressSummaryCard";
import { StreakFreezeCard } from "@/components/features/profile/StreakFreezeCard";
import { AchievementGrid } from "@/components/features/profile/AchievementGrid";
import { ProfileMenuLink } from "@/components/features/profile/ProfileMenuLink";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { LogoutMenuLink } from "@/components/features/profile/LogoutMenuLink";

const roleLabel: Record<string, string> = { teacher: "Professor", admin: "Administrador" };

export default async function ProfilePage() {
  const accessToken = await getServerAccessToken();
  const { user } = await getMe(accessToken);
  const isStudent = user.role === "student";

  // Professor/admin não têm progresso de gamificação nesta fase — evita mostrar o perfil do
  // aluno mockado (Alex) embaixo do nome de outra conta.
  if (!isStudent) {
    return (
      <div className="max-w-2xl mx-auto px-lg py-section flex flex-col gap-lg">
        <div className="flex flex-col items-center text-center gap-sm">
          <Avatar name={user.name} size={96} />
          <div>
            <h1 className="font-display text-headline-md font-bold text-on-surface">{user.name}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{user.email}</p>
          </div>
          <Badge tone="secondary">{roleLabel[user.role] ?? user.role}</Badge>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
          Contas de professor e administrador não têm progresso de gamificação — esse painel é
          exclusivo da experiência do aluno.
        </p>
        <div className="flex flex-col gap-sm">
          <ProfileMenuLink href="/perfil/configuracoes" icon="settings" label="Configurações" />
          <LogoutMenuLink />
        </div>
      </div>
    );
  }

  const [gamification, progress] = await Promise.all([
    getGamificationProfile(accessToken),
    getProgressSummary(accessToken),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-lg py-section flex flex-col gap-lg">
      <ProfileHeader
        name={user.name}
        level={gamification.level}
        xpTotal={gamification.xp_total}
        vip={gamification.is_vip}
      />
      <ProfileStatsGrid
        xpTotal={gamification.xp_total}
        level={gamification.level}
        streakCurrent={gamification.streak_current}
        streakBest={gamification.streak_best}
        gems={gamification.gems}
      />
      <ProgressSummaryCard summary={progress} />
      <StreakFreezeCard />
      <AchievementGrid unlocked={gamification.achievements} />
      <div className="flex flex-col gap-sm">
        <ProfileMenuLink href="/loja" icon="storefront" label="Loja" />
        <ProfileMenuLink href="/ajuda" icon="help" label="Ajuda e Bugs" />
        <ProfileMenuLink href="/perfil/configuracoes" icon="settings" label="Configurações" />
        <LogoutMenuLink />
      </div>
    </div>
  );
}
