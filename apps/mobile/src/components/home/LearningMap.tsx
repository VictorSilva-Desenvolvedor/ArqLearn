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
  return (
    <View style={{ width: "100%", maxWidth: 448, alignSelf: "center" }}>
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
