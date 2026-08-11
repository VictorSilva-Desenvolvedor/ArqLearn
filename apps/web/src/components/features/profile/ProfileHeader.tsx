import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { levelTitleFor } from "@/lib/gamification/levelTitle";
import { xpForLevel } from "@/lib/api/mocks/fixtures/levelCurve";

interface ProfileHeaderProps {
  name: string;
  level: number;
  xpTotal: number;
}

// Barra de XP-do-nível existe no code.html de referência (perfil/code.html:152-157, tube fina
// sob "Nível X • Título") e não tinha equivalente aqui.
export function ProfileHeader({ name, level, xpTotal }: ProfileHeaderProps) {
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpIntoLevel = Math.max(0, xpTotal - currentLevelXp);
  const xpNeededForLevel = nextLevelXp - currentLevelXp;

  return (
    <div className="flex flex-col items-center text-center gap-sm">
      <Avatar name={name} size={96} />
      <div className="w-full max-w-[16rem]">
        <h1 className="font-display text-headline-md font-bold text-on-surface">{name}</h1>
        <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
          Nível {level} • {levelTitleFor(level)}
        </p>
        <ProgressBar
          value={xpIntoLevel}
          max={xpNeededForLevel}
          variant="thin"
          tone="secondary"
          className="mt-sm"
        />
      </div>
    </div>
  );
}
