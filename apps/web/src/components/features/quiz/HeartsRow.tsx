import { Icon } from "@/components/ui/Icon";

const MAX_HEARTS = 5;

interface HeartsRowProps {
  hearts: number;
}

// Spec ("Hearts"): 5 ícones individuais no cabeçalho da sessão, coração perdido vira vazio em
// vez de sumir — não 1 ícone + contador numérico.
export function HeartsRow({ hearts }: HeartsRowProps) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${hearts} de ${MAX_HEARTS} vidas restantes`}>
      {Array.from({ length: MAX_HEARTS }).map((_, i) => (
        <Icon
          key={i}
          name="favorite"
          filled={i < hearts}
          className={i < hearts ? "text-error-red text-xl" : "text-outline-variant text-xl"}
        />
      ))}
    </div>
  );
}
