import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import { formatMinutesSeconds } from "@/lib/utils/format";
import type { ChatSourceRef } from "@/types/api";

interface ChatMessageBubbleProps {
  role: "user" | "assistant";
  message: string;
  sourceExcerpt?: string;
  sourceRef?: ChatSourceRef;
}

function formatSourceRef(ref: ChatSourceRef | undefined): string | null {
  if (!ref) return null;
  if (typeof ref.timestamp_ms === "number") return `Aos ${formatMinutesSeconds(ref.timestamp_ms / 1000)} do vídeo`;
  if (typeof ref.page === "number") return `Página ${ref.page}`;
  return null;
}

export function ChatMessageBubble({ role, message, sourceExcerpt, sourceRef }: ChatMessageBubbleProps) {
  const isUser = role === "user";
  const sourceLabel = formatSourceRef(sourceRef);

  return (
    <div className={cn("flex flex-col gap-xs max-w-[85%]", isUser ? "self-end items-end" : "self-start items-start")}>
      {/* Autoria explícita: duas bolhas sem rótulo (uma azul, uma cinza) deixavam a resposta da IA
          sem nenhum sinal de quem falou — a referência do Stitch
          (explica_o_e_perguntas_do_material/screen.png) rotula os dois lados. */}
      <span className="flex items-center gap-1 font-label text-label-caps uppercase text-on-surface-variant">
        {!isUser && <Icon name="lightbulb" filled className="text-secondary" size={14} />}
        {isUser ? "Você" : "Arq"}
      </span>
      <div
        className={cn(
          "px-md py-sm rounded-lg font-body-md text-body-md",
          isUser
            ? "bg-primary text-on-primary rounded-br-sm"
            : "bg-surface-gray text-on-surface rounded-bl-sm",
        )}
      >
        {message}
      </div>
      {sourceExcerpt && (
        // Superfície opaca (auditoria de 25/08/2026, rodada 4): a citação ficava direto sobre a
        // grade blueprint animada e as linhas cruzavam o texto em itálico — o Stitch põe o trecho
        // do documento dentro de um card branco com borda.
        <blockquote className="bg-surface-bright border-2 border-outline-variant border-l-4 border-l-primary rounded-lg px-sm py-xs font-body-sm text-body-sm text-on-surface-variant italic">
          {sourceExcerpt}
        </blockquote>
      )}
      {sourceLabel && (
        <span className="flex items-center gap-1 pl-sm font-label text-label-caps uppercase text-on-surface-variant">
          <Icon name="bookmark" className="text-sm" />
          {sourceLabel}
        </span>
      )}
    </div>
  );
}
