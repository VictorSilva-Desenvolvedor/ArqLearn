"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getUploadSummary, listChatHistory, sendChatMessage } from "@/lib/api/resources/materials";
import { ApiError } from "@/lib/api/http";
import { SummaryHeader } from "@/components/features/materialSummary/SummaryHeader";
import { ChatMessageBubble } from "@/components/features/materialChat/ChatMessageBubble";
import { ChatInputBar } from "@/components/features/materialChat/ChatInputBar";
import { ChatEmptyState } from "@/components/features/materialChat/ChatEmptyState";
import type { ChatSourceRef } from "@/types/api";

interface ViewMessage {
  id: string;
  role: "user" | "assistant";
  message: string;
  sourceExcerpt?: string;
  sourceRef?: ChatSourceRef;
}

export default function MaterialChatPage() {
  const { uploadId } = useParams<{ uploadId: string }>();
  const [title, setTitle] = useState("Material");
  const [messages, setMessages] = useState<ViewMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // `.catch` em ambas: sem eles, uma falha de rede virava unhandled rejection e a tela ficava
    // vazia sem explicar nada (mesma classe de defeito corrigida em Notificações na rodada 2).
    getUploadSummary(uploadId)
      .then((summary) => setTitle(summary.title))
      .catch(() => setTitle("Material"));
    listChatHistory(uploadId)
      .then(({ data }) => {
        setMessages(data.map((m) => ({ id: m.message_id, role: m.role, message: m.message })));
      })
      .catch(() => setError("Não foi possível carregar a conversa anterior. Você ainda pode perguntar."))
      .finally(() => setHistoryLoaded(true));
  }, [uploadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Retorna se deu certo — ChatInputBar só limpa o campo em caso de sucesso (achado do
  // /impeccable critique, 18/08/2026: antes disso o rascunho era apagado otimisticamente antes
  // da chamada resolver, então uma falha fazia o texto digitado sumir do input).
  const handleSend = async (text: string): Promise<boolean> => {
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
      // Remove a bolha otimista do usuário já que o envio falhou — evita duplicar a mensagem
      // quando ela for reenviada a partir do input restaurado.
      setMessages((current) => current.filter((m) => m.id !== userMessage.id));
      return false;
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SummaryHeader title={title} eyebrow="Chat sobre o Material" />
      <div
        role="log"
        aria-live="polite"
        aria-label="Conversa com a Arq"
        // `justify-end`: as mensagens ficam ancoradas na barra de digitação, não no topo — antes
        // uma conversa curta deixava ~500px de grade blueprint vazia entre a última resposta e o
        // input, e a decoração virava o elemento dominante da tela.
        className={`max-w-2xl mx-auto w-full px-md py-lg flex flex-col gap-md flex-1 ${
          messages.length === 0 ? "justify-center" : "justify-end"
        }`}
      >
        {historyLoaded && messages.length === 0 && (
          <ChatEmptyState title={title} onSuggestion={handleSend} disabled={sending} />
        )}
        {messages.map((m) => (
          <ChatMessageBubble
            key={m.id}
            role={m.role}
            message={m.message}
            sourceExcerpt={m.sourceExcerpt}
            sourceRef={m.sourceRef}
          />
        ))}
        {sending && (
          <p role="status" className="font-body-sm text-body-sm text-on-surface-variant self-start">
            Arq está digitando…
          </p>
        )}
        {error && (
          <p role="alert" className="font-body-sm text-body-sm text-error self-start">
            {error}
          </p>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInputBar onSend={handleSend} disabled={sending} />
    </>
  );
}
