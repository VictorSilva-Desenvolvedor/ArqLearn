import { useEffect, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatEmptyState } from "@/components/features/materialChat/ChatEmptyState";
import { ChatInputBar } from "@/components/features/materialChat/ChatInputBar";
import { ChatMessageBubble } from "@/components/features/materialChat/ChatMessageBubble";
import { useMaterialChat, type ViewMessage } from "@/components/features/materialChat/useMaterialChat";
import { SummaryHeader } from "@/components/features/materialSummary/SummaryHeader";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

// Espelha apps/web/src/app/(lesson)/materiais/[uploadId]/chat/page.tsx. O KeyboardAvoidingView
// não tem equivalente no web (o browser já evita que o teclado cubra o input) — é a adaptação
// mínima de plataforma pra a barra de envio não ficar escondida atrás do teclado em RN.
export default function MaterialChatScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { uploadId } = useLocalSearchParams<{ uploadId: string }>();
  const { title, messages, sending, error, historyLoaded, sendMessage } = useMaterialChat(uploadId);
  // FlatList em vez de ScrollView+map (achado de /impeccable audit, 18/08/2026): uma conversa não
  // tem teto natural de tamanho como as outras listas do app — só essa precisava de virtualização
  // de verdade.
  const listRef = useRef<FlatList<ViewMessage>>(null);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages, sending]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <SummaryHeader title={title} eyebrow="Chat sobre o Material" />
        <FlatList
          ref={listRef}
          style={styles.body}
          // Mensagens ancoradas na barra de digitação, não no topo (auditoria de 25/08/2026,
          // rodada 4 — mesma correção do web): uma conversa curta deixava uma faixa grande de
          // fundo blueprint vazio entre a última resposta e o input.
          contentContainerStyle={[
            styles.bodyContent,
            messages.length === 0 ? styles.bodyContentEmpty : styles.bodyContentFilled,
          ]}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <ChatMessageBubble
              role={item.role}
              message={item.message}
              sourceExcerpt={item.sourceExcerpt}
              sourceRef={item.sourceRef}
            />
          )}
          accessibilityRole="list"
          accessibilityLabel="Conversa com a Arq"
          ListEmptyComponent={
            historyLoaded ? (
              <ChatEmptyState title={title} onSuggestion={sendMessage} disabled={sending} />
            ) : null
          }
          ListFooterComponent={
            <>
              {sending && (
                <Text accessibilityLiveRegion="polite" style={[type.bodySm, styles.typing]}>
                  Arq está digitando…
                </Text>
              )}
              {error && (
                <Text accessibilityLiveRegion="polite" style={[type.bodySm, styles.error]}>
                  {error}
                </Text>
              )}
            </>
          }
        />
        <ChatInputBar onSend={sendMessage} disabled={sending} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    body: {
      flex: 1,
    },
    bodyContent: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      gap: spacing.md,
      flexGrow: 1,
    },
    bodyContentEmpty: {
      justifyContent: "center",
    },
    bodyContentFilled: {
      justifyContent: "flex-end",
    },
    typing: {
      alignSelf: "flex-start",
      color: colors.onSurfaceVariant,
    },
    error: {
      alignSelf: "flex-start",
      color: colors.error,
      marginTop: spacing.xs,
    },
  });
