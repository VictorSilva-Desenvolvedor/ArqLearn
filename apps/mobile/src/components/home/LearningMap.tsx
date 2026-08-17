import { View } from "react-native";
import { UnitSection, type UnitNodeData, type UnitStatus } from "./UnitSection";

export interface LearningMapUnit {
  trackId: string;
  title: string;
  subtitle?: string;
  status: UnitStatus;
  nodes: UnitNodeData[];
}

export function LearningMap({ units }: { units: LearningMapUnit[] }) {
  // maxWidth/alignSelf removidos daqui: o único consumidor (HomeScreen, apps/mobile/src/app/
  // (tabs)/index.tsx) já aplica o mesmo limite de 448 no ScrollView pai — tinha duas fontes da
  // verdade pro mesmo número (achado de /impeccable audit, 2026-08-17).
  return (
    <View style={{ width: "100%" }}>
      {units.map((unit) => (
        <UnitSection
          key={unit.trackId}
          title={unit.title}
          subtitle={unit.subtitle}
          status={unit.status}
          nodes={unit.nodes}
        />
      ))}
    </View>
  );
}
