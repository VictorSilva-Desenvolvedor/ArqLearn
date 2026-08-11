// Cobre o restante do caminho a partir de onde a névoa começa (ver UnitSection) — camada por
// cima que esconde a existência dos nós, não um filtro em cada um.
//
// Tentativas anteriores viraram "retângulo/porta branca": (1) um linear-gradient até uma cor
// sólida tem, por definição, uma borda onde resolve — sempre vai parecer uma parede; (2)
// backdrop-blur borra o que está ATRÁS do elemento, não a própria forma dele — empilhar isso com
// um background-image não deixa a MANCHA em si borrada, só endurece a aparência. O jeito certo é
// `filter: blur()` (classe `blur-*` do Tailwind) aplicado em várias manchas soltas, pequenas o
// bastante pra sobrar espaço vazio entre elas — é o vão que faz parecer névoa, não um preenchimento
// contínuo. Cores propositalmente variadas (surface-gray claro + outline-variant mais escuro) —
// os tokens de "branco" deste tema são quase idênticos entre si, então usar só eles some com
// qualquer textura.
const wisps = [
  { top: "0%", left: "5%", size: 130, tone: "bg-surface-gray", opacity: 60, blur: "blur-2xl" },
  { top: "8%", left: "55%", size: 150, tone: "bg-outline-variant", opacity: 45, blur: "blur-2xl" },
  { top: "25%", left: "10%", size: 170, tone: "bg-outline-variant", opacity: 55, blur: "blur-3xl" },
  { top: "22%", left: "60%", size: 140, tone: "bg-surface-gray", opacity: 70, blur: "blur-2xl" },
  { top: "45%", left: "30%", size: 190, tone: "bg-outline-variant", opacity: 65, blur: "blur-3xl" },
  { top: "48%", left: "-5%", size: 150, tone: "bg-surface-gray", opacity: 60, blur: "blur-2xl" },
  { top: "65%", left: "50%", size: 180, tone: "bg-outline-variant", opacity: 75, blur: "blur-3xl" },
  { top: "68%", left: "5%", size: 160, tone: "bg-surface-gray", opacity: 70, blur: "blur-2xl" },
  { top: "85%", left: "35%", size: 200, tone: "bg-outline-variant", opacity: 85, blur: "blur-3xl" },
  { top: "88%", left: "-8%", size: 170, tone: "bg-outline-variant", opacity: 80, blur: "blur-3xl" },
];

export function FogOverlay({ topPercent }: { topPercent: number }) {
  return (
    <div
      className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none overflow-hidden"
      style={{ top: `${topPercent}%` }}
      aria-hidden="true"
    >
      {wisps.map((w, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${w.tone} ${w.blur}`}
          style={{
            top: w.top,
            left: w.left,
            width: w.size,
            height: w.size,
            opacity: w.opacity / 100,
          }}
        />
      ))}
    </div>
  );
}
