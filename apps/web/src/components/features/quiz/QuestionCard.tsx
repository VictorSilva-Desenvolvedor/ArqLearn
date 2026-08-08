import type { QuestionOption } from "@/types/api";
import { AnswerOption } from "./AnswerOption";

interface QuestionCardProps {
  prompt: string;
  options: QuestionOption[];
  selectedOptionId: string | null;
  revealed: boolean;
  isSelectedCorrect: boolean;
  onSelect: (optionId: string) => void;
}

export function QuestionCard({
  prompt,
  options,
  selectedOptionId,
  revealed,
  isSelectedCorrect,
  onSelect,
}: QuestionCardProps) {
  return (
    <div className="max-w-2xl mx-auto w-full px-md py-lg flex flex-col gap-lg flex-1">
      <h2 className="font-display text-question-lg text-on-surface">{prompt}</h2>
      <div className="flex flex-col gap-sm">
        {options.map((option) => (
          <AnswerOption
            key={option.id}
            label={option.label}
            selected={selectedOptionId === option.id}
            revealed={revealed}
            isCorrect={selectedOptionId === option.id ? isSelectedCorrect : undefined}
            disabled={revealed}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  );
}
