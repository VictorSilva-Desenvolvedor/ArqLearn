import { useCallback, useEffect, useState } from "react";
import { getUploadSummary, listChatHistory, sendChatMessage } from "@/lib/api/resources/materials";
import { ApiError } from "@/lib/api/http";
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
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // `.catch` em ambas (auditoria de 25/08/2026, rodada 4 — mesma correção do web): sem eles uma
    // falha de rede virava unhandled rejection e a tela ficava vazia sem explicar nada.
    getUploadSummary(uploadId)
      .then((summary) => {
        if (!cancelled) setTitle(summary.title);
      })
      .catch(() => undefined);
    listChatHistory(uploadId)
      .then(({ data }) => {
        if (cancelled) return;
        setMessages(data.map((m) => ({ id: m.message_id, role: m.role, message: m.message })));
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar a conversa anterior. Você ainda pode perguntar.");
      })
      .finally(() => {
        if (!cancelled) setHistoryLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [uploadId]);

  // P2 do /impeccable critique (18/08/2026, achado equivalente ao do web): sem catch, uma falha
  // aqui deixava a mensagem do usuário "presa" no histórico sem nenhuma explicação. Retorna
  // `false` em caso de falha pra `ChatInputBar` saber que não deve limpar o rascunho digitado.
  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      const userMessage: ViewMessage = { id: `local-${Date.now()}`, role: "user", message: text };
      setMessages((current) => [...current, userMessage]);
      setSending(true);
      setError(null);
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
        return true;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Não foi possível enviar sua mensagem. Tente novamente.");
        setMessages((current) => current.filter((m) => m.id !== userMessage.id));
        return false;
      } finally {
        setSending(false);
      }
    },
    [uploadId],
  );

  return { title, messages, sending, error, historyLoaded, sendMessage };
}
