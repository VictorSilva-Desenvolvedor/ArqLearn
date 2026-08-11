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
        <blockquote className="border-l-4 border-outline-variant pl-sm font-body-sm text-body-sm text-on-surface-variant italic">
          {sourceExcerpt}
        </blockquote>
      )}
      {sourceLabel && (
        <span className="flex items-center gap-1 pl-sm font-label-caps text-label-caps uppercase text-on-surface-variant">
          <Icon name="bookmark" className="text-sm" />
          {sourceLabel}
        </span>
      )}
    </div>
  );
}
