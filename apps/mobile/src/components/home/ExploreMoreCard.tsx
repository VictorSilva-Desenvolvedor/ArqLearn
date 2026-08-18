import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { spacing, type } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

// Antes, o final da Home mostrava até 2 outras trilhas (outras matérias) empilhadas depois da
// trilha em destaque — não fazia mais sentido com a tela de Explorar já madura (busca, seletor de
// tema). Esse card substitui isso: só a trilha em foco aparece no mapa, e o final vira um convite
// direto pra tela certa de trocar de assunto, em vez de um preview truncado de outras matérias.
export function ExploreMoreCard() {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <Card padding="lg" radius="lg" style={styles.card}>
      <Icon name="explore" size={32} color={colors.primary} />
      <View style={styles.textBlock}>
        <Text style={[type.headlineMd, styles.title]}>Quer estudar outro assunto?</Text>
        <Text style={[type.bodyMd, styles.caption]}>
          Veja todas as trilhas disponíveis e troque de matéria quando quiser.
        </Text>
      </View>
      <Button variant="primary" fullWidth onPress={() => router.push("/explorar" as never)}>
        Explorar trilhas
      </Button>
    </Card>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    card: {
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    textBlock: {
      alignItems: "center",
    },
    title: {
      color: colors.onSurface,
      fontWeight: "700",
      textAlign: "center",
    },
    caption: {
      color: colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: 4,
    },
  });
