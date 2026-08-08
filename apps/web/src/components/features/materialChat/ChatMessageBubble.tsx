import { cn } from "@/lib/utils/cn";

interface ChatMessageBubbleProps {
  role: "user" | "assistant";
  message: string;
  sourceExcerpt?: string;
}

export function ChatMessageBubble({ role, message, sourceExcerpt }: ChatMessageBubbleProps) {
  const isUser = role === "user";
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
    </div>
  );
}
