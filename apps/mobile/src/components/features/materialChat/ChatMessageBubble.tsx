import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { formatMinutesSeconds } from "@/lib/utils/format";
import { radius, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
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

// Espelha apps/web/src/components/features/materialChat/ChatMessageBubble.tsx.
export function ChatMessageBubble({ role, message, sourceExcerpt, sourceRef }: ChatMessageBubbleProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const isUser = role === "user";
  const sourceLabel = formatSourceRef(sourceRef);

  return (
    <View style={[styles.container, isUser ? styles.userAlign : styles.assistantAlign]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[type.bodyMd, isUser ? styles.userText : styles.assistantText]}>{message}</Text>
      </View>
      {sourceExcerpt && (
        <View style={styles.excerptBlock}>
          <Text style={[type.bodySm, styles.excerpt]}>{sourceExcerpt}</Text>
        </View>
      )}
      {sourceLabel && (
        <View style={styles.sourceRow}>
          <Icon name="bookmark" size={14} color={colors.onSurfaceVariant} />
          <Text style={[type.labelCaps, styles.sourceLabel]}>{sourceLabel}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      maxWidth: "85%",
      gap: 4,
    },
    userAlign: {
      alignSelf: "flex-end",
      alignItems: "flex-end",
    },
    assistantAlign: {
      alignSelf: "flex-start",
      alignItems: "flex-start",
    },
    bubble: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: radius.md,
    },
    userBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: radius.sm,
    },
    assistantBubble: {
      backgroundColor: colors.surfaceGray,
      borderBottomLeftRadius: radius.sm,
    },
    userText: {
      color: colors.onPrimary,
    },
    assistantText: {
      color: colors.onSurface,
    },
    excerptBlock: {
      borderLeftWidth: 4,
      borderLeftColor: colors.outlineVariant,
      paddingLeft: 12,
    },
    excerpt: {
      color: colors.onSurfaceVariant,
      fontStyle: "italic",
    },
    sourceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingLeft: 12,
    },
    sourceLabel: {
      color: colors.onSurfaceVariant,
      textTransform: "uppercase",
    },
  });
