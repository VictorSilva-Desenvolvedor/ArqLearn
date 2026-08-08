import { Avatar } from "@/components/ui/Avatar";
import { levelTitleFor } from "@/lib/gamification/levelTitle";

interface ProfileHeaderProps {
  name: string;
  level: number;
}

export function ProfileHeader({ name, level }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center gap-sm">
      <Avatar name={name} size={96} />
      <div>
        <h1 className="font-display text-headline-md font-bold text-on-surface">{name}</h1>
        <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
          Nível {level} • {levelTitleFor(level)}
        </p>
      </div>
    </div>
  );
}
