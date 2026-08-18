import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";

type ZoneKind = "promotion" | "demotion";

const zoneConfig: Record<ZoneKind, { label: string; icon: string; className: string }> = {
  promotion: {
    label: "Zona de Promoção",
    icon: "trending_up",
    className: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  },
  demotion: {
    label: "Zona de Rebaixamento",
    icon: "trending_down",
    className: "bg-error-container text-on-error-container",
  },
};

export function LeagueZoneBanner({ kind }: { kind: ZoneKind }) {
  const config = zoneConfig[kind];
  return (
    <div
      className={cn(
        "flex items-center gap-xs px-md py-1 font-label text-label-caps uppercase",
        config.className,
      )}
    >
      <Icon name={config.icon} className="text-base" />
      {config.label}
    </div>
  );
}
