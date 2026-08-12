import { useCallback, useEffect, useState } from "react";
import { getUploadSummary, listChatHistory, sendChatMessage } from "@/lib/api/resources/materials";
import type { ChatSourceRef } from "@/types/api";

export interface ViewMessage {
  id: string;
  role: "user" | "assistant";
  message: string;
  sourceExcerpt?: string;
  sourceRef?: ChatSourceRef;
}

// Hook colocado no diretório da feature, seguindo a convenção já usada em
// useQuizSession/useInfiniteModeSession — diferente do web, que inlina essa lógica direto em
// app/(lesson)/materiais/[uploadId]/chat/page.tsx.
export function useMaterialChat(uploadId: string) {
  const [title, setTitle] = useState("Material");
  const [messages, setMessages] = useState<ViewMessage[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUploadSummary(uploadId).then((summary) => {
      if (!cancelled) setTitle(summary.title);
    });
    listChatHistory(uploadId).then(({ data }) => {
      if (cancelled) return;
      setMessages(data.map((m) => ({ id: m.message_id, role: m.role, message: m.message })));
    });
    return () => {
      cancelled = true;
    };
  }, [uploadId]);

  // Sem try/catch de erro no envio — fiel ao web (mesmo padrão de useQuizSession.verify/
  // useInfiniteModeSession.verify, que também só têm try/finally).
  const sendMessage = useCallback(
    async (text: string) => {
      const userMessage: ViewMessage = { id: `local-${Date.now()}`, role: "user", message: text };
      setMessages((current) => [...current, userMessage]);
      setSending(true);
      try {
        const answer = await sendChatMessage(uploadId, text);
        setMessages((current) => [
          ...current,
          {
            id: answer.message_id,
            role: "assistant",
            message: answer.answer,
            sourceExcerpt: answer.source_excerpt,
            sourceRef: answer.source_ref,
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [uploadId],
  );

  return { title, messages, sending, sendMessage };
}
