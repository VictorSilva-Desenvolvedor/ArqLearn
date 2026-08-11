"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getUploadSummary, listChatHistory, sendChatMessage } from "@/lib/api/resources/materials";
import { SummaryHeader } from "@/components/features/materialSummary/SummaryHeader";
import { ChatMessageBubble } from "@/components/features/materialChat/ChatMessageBubble";
import { ChatInputBar } from "@/components/features/materialChat/ChatInputBar";
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUploadSummary(uploadId).then((summary) => setTitle(summary.title));
    listChatHistory(uploadId).then(({ data }) => {
      setMessages(data.map((m) => ({ id: m.message_id, role: m.role, message: m.message })));
    });
  }, [uploadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
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
  };

  return (
    <>
      <SummaryHeader title={title} eyebrow="Chat sobre o Material" />
      <div className="max-w-2xl mx-auto w-full px-md py-lg flex flex-col gap-md flex-1">
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
          <p className="font-body-sm text-body-sm text-on-surface-variant self-start">Arq está digitando…</p>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInputBar onSend={handleSend} disabled={sending} />
    </>
  );
}
