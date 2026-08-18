import type { QuestionDifficulty, QuestionOption, QuestionType } from "@/types/api";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { AnswerOption } from "./AnswerOption";
import { FillBlankInput } from "./FillBlankInput";

interface QuestionCardProps {
  prompt: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  imageUrl?: string;
  options: QuestionOption[];
  selectedOptionId: string | null;
  revealed: boolean;
  verifying?: boolean;
  isSelectedCorrect: boolean;
  onSelect: (optionId: string) => void;
}

const difficultyPresentation: Record<
  QuestionDifficulty,
  { label: string; tone: "tertiary" | "secondary" | "error" | "primary" }
> = {
  easy: { label: "Fácil", tone: "tertiary" },
  medium: { label: "Médio", tone: "secondary" },
  hard: { label: "Difícil", tone: "error" },
  impossible: { label: "Impossível", tone: "primary" },
};

export function QuestionCard({
  prompt,
  type,
  difficulty,
  imageUrl,
  options,
  selectedOptionId,
  revealed,
  verifying = false,
  isSelectedCorrect,
  onSelect,
}: QuestionCardProps) {
  const difficultyInfo = difficultyPresentation[difficulty];
  return (
    <div className="max-w-2xl mx-auto w-full px-md py-lg flex flex-col gap-lg flex-1">
      <div className="flex flex-col gap-xs">
        <Badge tone={difficultyInfo.tone} className="self-start">
          {difficultyInfo.label}
        </Badge>
        <h2 className="font-display text-question-lg text-on-surface">{prompt}</h2>
      </div>
      {imageUrl && (
        <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden border-2 border-outline-variant bg-surface-gray relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem vem de URL externa arbitrária do conteúdo gerado, sem domínio fixo pra configurar em next.config */}
          <img src={imageUrl} alt={`Diagrama de referência da questão: ${prompt}`} className="w-full h-full object-cover" />
          <div className="absolute bottom-2 right-2 bg-surface-bright/90 px-2 py-1 rounded font-label-caps text-label-caps text-outline border border-outline-variant">
            FIG. 1: ELEVAÇÃO
          </div>
        </div>
      )}
      {type === "fill_blank" ? (
        <FillBlankInput
          value={selectedOptionId ?? ""}
          revealed={revealed}
          locked={revealed || verifying}
          isCorrect={isSelectedCorrect}
          correctAnswer={options[0]?.label}
          onChange={onSelect}
        />
      ) : (
        <div
          role="radiogroup"
          aria-label={prompt}
          className={cn(
            "gap-sm",
            type === "matching" ? "grid grid-cols-1 md:grid-cols-2" : "flex flex-col",
          )}
        >
          {options.map((option) => (
            <AnswerOption
              key={option.id}
              label={option.label}
              selected={selectedOptionId === option.id}
              revealed={revealed}
              verifying={verifying}
              isCorrect={selectedOptionId === option.id ? isSelectedCorrect : undefined}
              disabled={revealed || verifying}
              onClick={() => onSelect(option.id)}
            />
          ))}
        </div>
      )}
      {/* Anúncio pra leitor de tela — a cor/ícone de certo-errado no card não chega até quem usa
          um leitor de tela sem isto (spec §4, "support screen readers"). */}
      <p role="status" aria-live="polite" className="sr-only">
        {revealed ? (isSelectedCorrect ? "Resposta correta." : "Resposta incorreta.") : ""}
      </p>
    </div>
  );
}
