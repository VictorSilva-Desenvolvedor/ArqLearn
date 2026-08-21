import Svg, { Circle, Path } from "react-native-svg";
import { useColors } from "@/theme/useColors";

interface MascotPlaceholderProps {
  size?: number;
}

// Mascote de verdade ainda não existe (arte final pendente) — este SVG é só um espaço reservado
// de propósito simples/tracejado, pra não ser confundido com arte final. Trocar pelo mascote
// definitivo quando ele existir; manter o mesmo `size` default preserva o layout da tela de
// boas-vindas (app/welcome.tsx) sem precisar reajustar nada ao redor.
export function MascotPlaceholder({ size = 120 }: MascotPlaceholderProps) {
  const colors = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Circle
        cx={50}
        cy={52}
        r={34}
        fill={colors.primaryFixed}
        stroke={colors.primaryContainer}
        strokeWidth={2}
        strokeDasharray="6 4"
      />
      <Circle cx={38} cy={48} r={4} fill={colors.primary} />
      <Circle cx={62} cy={48} r={4} fill={colors.primary} />
      <Path d="M36 62 Q50 72 64 62" stroke={colors.primary} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}
