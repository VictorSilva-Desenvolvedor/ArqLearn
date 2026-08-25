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
    // md:justify-center: numa janela de desktop a pergunta ficava colada no topo com ~450px de
    // vazio até a barra de ação (auditoria de 25/08/2026). No telefone continua no topo, onde a
    // rolagem natural resolve.
    <div className="max-w-2xl mx-auto w-full px-md py-lg flex flex-col gap-lg flex-1 md:justify-center">
      {/* Painel opaco (decisão do usuário, 25/08/2026, pendência #10): sem ele o enunciado — o
          texto mais importante da tela — ficava direto sobre o fundo blueprint animado, com
          glifos decorativos cruzando as palavras (medido em screenshot no Modo Infinito, mesmo
          componente da tela B). Mesma moldura já usada em Conquista/Resumo Inteligente
          (bg-surface-bright + border-outline-variant), não uma nova. */}
      <div className="flex flex-col gap-xs bg-surface-bright border-2 border-outline-variant rounded-xl px-md py-md">
        <Badge tone={difficultyInfo.tone} className="self-start">
          {difficultyInfo.label}
        </Badge>
        <h2 className="font-display text-question-lg text-on-surface">{prompt}</h2>
      </div>
      {imageUrl && (
        <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden border-2 border-outline-variant bg-surface-gray relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem vem de URL externa arbitrária do conteúdo gerado, sem domínio fixo pra configurar em next.config */}
          {/* P2 do /impeccable critique (18/08/2026): o alt anterior repetia o prompt da
              pergunta literalmente — quem usa leitor de tela ouvia a mesma frase duas vezes sem
              aprender nada sobre o que o diagrama de fato mostra. Sem descrição real do diagrama
              vinda do pipeline de conteúdo ainda, um rótulo genérico e honesto vale mais que uma
              repetição inútil. */}
          <img src={imageUrl} alt="Diagrama de referência visual da questão" className="w-full h-full object-cover" />
          <div className="absolute bottom-2 right-2 bg-surface-bright/90 px-2 py-1 rounded font-label text-label-caps text-outline border border-outline-variant">
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
