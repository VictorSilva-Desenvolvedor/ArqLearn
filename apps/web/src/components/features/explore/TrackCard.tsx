import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import type { RecommendedTrack } from "@/lib/api/mocks/fixtures/exploreTracks";

interface TrackCardProps extends RecommendedTrack {
  isSelectedTheme?: boolean;
  onSelect?: () => void;
}

// hasContent:false (ver exploreTracks.ts/themes.ts) troca o selo de dificuldade/duração — que
// seriam inventados, a trilha não existe de verdade ainda — por "Em construção" (mesma
// convenção/tom de UnitSection.tsx) e esmaece o card, sem impedir o toque: selecionar o tema
// ainda é útil (Home mostra o aviso "estamos preparando..." e o Modo Infinito continua fora do
// ar só quando de fato não há conteúdo).
export function TrackCard({ track, difficulty, durationMinutes, icon, isSelectedTheme, hasContent, onSelect }: TrackCardProps) {
  return (
    <Card
      padding="md"
      radius="lg"
      interactive={Boolean(onSelect)}
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-sm relative text-left",
        isSelectedTheme && "border-primary bg-primary-fixed",
        !hasContent && "opacity-60",
      )}
    >
      {isSelectedTheme && (
        <Badge tone="primary" className="absolute top-2 right-2">
          Selecionado
        </Badge>
      )}
      <Icon name={icon} filled className="text-3xl text-primary" />
      <p className="font-display text-question-sm text-on-surface font-bold">{track.title}</p>
      {hasContent ? (
        <div className="flex items-center gap-sm">
          <Badge tone="primary">{difficulty}</Badge>
          <span className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
            <Icon name="schedule" className="text-base" />
            {durationMinutes}min
          </span>
        </div>
      ) : (
        <Badge tone="neutral">Em construção</Badge>
      )}
    </Card>
  );
}
