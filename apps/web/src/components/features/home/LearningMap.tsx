import { UnitSection, type UnitNodeData, type UnitStatus } from "./UnitSection";

export interface LearningMapUnit {
  trackId: string;
  title: string;
  subtitle?: string;
  status: UnitStatus;
  nodes: UnitNodeData[];
}

export function LearningMap({ units }: { units: LearningMapUnit[] }) {
  return (
    // 28rem (448px): mirrors apps/mobile's local LearningMap maxWidth, keeps the path readable on
    // tablets — a deliberate per-component width, not a reusable scale value (see DESIGN.md Layout).
    <section className="relative max-w-[28rem] mx-auto">
      {units.map((unit) => (
        <UnitSection
          key={unit.trackId}
          title={unit.title}
          subtitle={unit.subtitle}
          status={unit.status}
          nodes={unit.nodes}
        />
      ))}
    </section>
  );
}
