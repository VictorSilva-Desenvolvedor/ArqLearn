import { cn } from "@/lib/utils/cn";

interface LoadingBlueprintProps {
  /** Tamanho do ícone em px. Default: 20 (inline) / 208 (fullscreen). */
  size?: number;
  /**
   * "inline" = só o ícone animado (spinner de botão, linha de lista carregando).
   * "fullscreen" = quadro com grade + cantos técnicos + ícone + wordmark + legenda — gate de
   * autenticação, fallback de rota, sessão de lição/Modo Infinito carregando.
   */
  variant?: "inline" | "fullscreen";
  /** Legenda abaixo do wordmark — só no variant "fullscreen". */
  label?: string;
  className?: string;
}

// Ícone único reaproveitado nos dois variants: prédio se desenhando (traço com stroke-dashoffset)
// + lapiseira percorrendo o traçado + anel de pulso — ver Docs/stitch_app_visual_identity/
// tela_de_carregamento_splash_screen/code.html (fonte original) e globals.css (@keyframes
// blueprint-draw/blueprint-pencil). Espelhado em apps/mobile/.../LoadingBlueprint.tsx via
// react-native-svg (CSS keyframes não existem em React Native).
function BlueprintIcon({ size, className }: { size: number; className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)} style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
      <svg viewBox="0 0 100 100" fill="none" className="text-primary" style={{ width: size * 0.8, height: size * 0.8 }}>
        <path className="blueprint-draw-path" d="M10 80 H90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          className="blueprint-draw-path"
          d="M20 80 V40 L50 20 L80 40 V80 H20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          className="blueprint-draw-path"
          d="M40 50 H60 V70 H40 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
        <g className="blueprint-draw-pencil text-secondary">
          <circle cx="0" cy="0" r="2" fill="currentColor" />
          <line x1="0" y1="0" x2="-5" y2="10" stroke="currentColor" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

export function LoadingBlueprint({ size, variant = "inline", label, className }: LoadingBlueprintProps) {
  if (variant === "fullscreen") {
    const boxSize = size ?? 208;
    return (
      <div className={cn("flex flex-col items-center justify-center gap-lg py-section", className)}>
        <div className="relative flex items-center justify-center rounded-xl" style={{ width: boxSize, height: boxSize }}>
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--color-blueprint-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--color-blueprint-grid) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
          <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary-container opacity-50" />
          <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary-container opacity-50" />
          <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary-container opacity-50" />
          <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary-container opacity-50" />
          <BlueprintIcon size={boxSize * 0.7} />
        </div>
        <p className="font-display text-display-lg font-bold text-primary">ArqLearn</p>
        {label && (
          <p className="font-display text-headline-md text-on-surface-variant text-center animate-pulse-soft">
            {label}
          </p>
        )}
      </div>
    );
  }

  return <BlueprintIcon size={size ?? 20} className={className} />;
}
