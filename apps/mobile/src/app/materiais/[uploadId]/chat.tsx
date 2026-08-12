import { useEffect, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { ChatInputBar } from "@/components/features/materialChat/ChatInputBar";
import { ChatMessageBubble } from "@/components/features/materialChat/ChatMessageBubble";
import { useMaterialChat } from "@/components/features/materialChat/useMaterialChat";
import { SummaryHeader } from "@/components/features/materialSummary/SummaryHeader";
import { colors, spacing, type } from "@/theme/tokens";

// Espelha apps/web/src/app/(lesson)/materiais/[uploadId]/chat/page.tsx. O KeyboardAvoidingView
// não tem equivalente no web (o browser já evita que o teclado cubra o input) — é a adaptação
// mínima de plataforma pra a barra de envio não ficar escondida atrás do teclado em RN.
export default function MaterialChatScreen() {
  const { uploadId } = useLocalSearchParams<{ uploadId: string }>();
  const { title, messages, sending, sendMessage } = useMaterialChat(uploadId);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, sending]);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <SummaryHeader title={title} eyebrow="Chat sobre o Material" />
      <ScrollView ref={scrollRef} style={styles.body} contentContainerStyle={styles.bodyContent}>
        {messages.map((m) => (
          <ChatMessageBubble
            key={m.id}
            role={m.role}
            message={m.message}
            sourceExcerpt={m.sourceExcerpt}
            sourceRef={m.sourceRef}
          />
        ))}
        {sending && <Text style={[type.bodySm, styles.typing]}>Arq está digitando…</Text>}
      </ScrollView>
      <ChatInputBar onSend={sendMessage} disabled={sending} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  typing: {
    alignSelf: "flex-start",
    color: colors.onSurfaceVariant,
  },
});
