import { cn } from "@/lib/utils/cn";

interface FillBlankInputProps {
  value: string;
  revealed: boolean;
  /** Trava a edição sem mostrar a cor de certo/errado — usado enquanto a resposta está sendo
   * verificada no servidor (ainda não sabemos se acertou). `revealed` sozinho controla a cor. */
  locked?: boolean;
  isCorrect?: boolean;
  correctAnswer?: string;
  onChange: (value: string) => void;
}

// fill_blank não tem "opções pra clicar" — é a única variante de pergunta que precisa de um
// campo de texto de verdade em vez da lista de AnswerOption (spec: sem input de texto até aqui).
export function FillBlankInput({ value, revealed, locked = revealed, isCorrect, correctAnswer, onChange }: FillBlankInputProps) {
  let toneClasses = "border border-outline-variant bg-surface-bright focus:border-primary";
  if (revealed) {
    toneClasses = isCorrect
      ? "border-2 border-tertiary bg-tertiary-fixed text-on-tertiary-fixed-variant"
      : "border-2 border-error bg-error-container text-on-error-container";
  }

  return (
    <div className="flex flex-col gap-xs">
      <input
        type="text"
        value={value}
        // readOnly em vez de disabled: <input disabled> ganha um esmaecimento nativo do Chromium
        // que ignora qualquer border-color/background-color do autor (só aparece testando o
        // estado revelado de verdade — não dá pra ver editando o JSX). readOnly bloqueia edição
        // sem acionar esse estilo forçado do navegador.
        readOnly={locked}
        tabIndex={locked ? -1 : undefined}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Digite sua resposta"
        aria-label="Resposta"
        className={cn(
          "w-full rounded-lg px-md py-sm font-body-lg text-body-lg transition-colors",
          locked && "cursor-default",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          toneClasses,
        )}
      />
      {revealed && !isCorrect && correctAnswer && (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Resposta esperada: <span className="font-bold">{correctAnswer}</span>
        </p>
      )}
    </div>
  );
}
