import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/http";
import { getGemPackages, redeemGemCoupon } from "@/lib/api/resources/gems";
import { spacing, radius, type as typeTokens } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";
import type { GemPackage } from "@/types/api";

// Pacotes de gemas (TDD §15.2) — mesmo molde de app/(tabs)/vip.tsx: catálogo real, compra por
// cartão travada em mockup (botão desabilitado, "Em breve"), cupom como caminho funcional hoje.
// Espelha apps/web/src/app/(shell)/loja/gemas/page.tsx.
function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function GemPackagesScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const { gamification, updateGamification } = useAuth();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<GemPackage[]>([]);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGemPackages().then((data) => {
      if (!cancelled) setPackages(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRedeem = async () => {
    if (redeeming || code.trim().length === 0) return;
    setError(null);
    setRedeeming(true);
    try {
      const result = await redeemGemCoupon(code.trim());
      updateGamification({ gems: result.gems });
      setCode("");
      showToast(`+${result.gems_credited} gemas creditadas!`, "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível resgatar o cupom agora.");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconButton icon={<Icon name="back" size={22} color={colors.onSurface} />} label="Voltar" onPress={() => router.back()} />
          <Text style={[typeTokens.displayLg, styles.headerTitle]}>Pacotes de Gemas</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.gemsBadge}>
            <Icon name="gems" size={40} color={colors.onPrimaryContainer} />
          </View>
          <Text style={[typeTokens.bodyLg, styles.muted]}>
            Você tem <Text style={styles.gemsCount}>{gamification.gems}</Text> gemas.
          </Text>
        </View>

        <View style={styles.packagesGrid}>
          {packages.map((pkg) => (
            <Card key={pkg.id} padding="lg" style={styles.packageCard}>
              {pkg.name === "Pacote Ouro" && <Badge tone="gold" children="Melhor valor" />}
              <Icon name="gems" size={28} color={colors.primary} />
              <Text style={[typeTokens.questionSm, styles.packageName]}>{pkg.name}</Text>
              <Text style={[typeTokens.headlineMd, styles.packageAmount]}>{pkg.gems_amount} gemas</Text>
              <Text style={[typeTokens.bodyMd, styles.muted]}>{formatBRL(pkg.price_brl_cents)}</Text>
              <Button variant="ghost" fullWidth disabled>
                Comprar — Em breve
              </Button>
            </Card>
          ))}
        </View>

        <Card padding="lg" style={styles.redeemCard}>
          <Text style={[typeTokens.questionLg, styles.redeemTitle]}>Já tenho um código</Text>
          <Text style={[typeTokens.bodySm, styles.muted]}>Digite o código de 10 dígitos que você recebeu.</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            keyboardType="number-pad"
            maxLength={10}
            accessibilityLabel="Código do pacote, 10 dígitos"
            placeholder="0000000000"
            placeholderTextColor={colors.outline}
          />
          {error && <Text style={[typeTokens.bodySm, styles.error]}>{error}</Text>}
          <Button
            variant="primary"
            fullWidth
            disabled={redeeming || code.trim().length !== 10}
            onPress={handleRedeem}
            icon={<Icon name="ticketPercent" size={18} color={colors.onPrimary} />}
          >
            {redeeming ? "Resgatando…" : "Resgatar Código"}
          </Button>
        </Card>

        <Text style={[typeTokens.bodySm, styles.footerNote]}>
          Compra por cartão ainda não está disponível. Use um código por enquanto.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    headerTitle: {
      flex: 1,
      color: colors.onSurface,
      fontWeight: "700",
    },
    hero: {
      alignItems: "center",
      gap: spacing.xs,
    },
    gemsBadge: {
      width: 72,
      height: 72,
      borderRadius: radius.xl,
      backgroundColor: colors.primaryContainer,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    gemsCount: {
      fontWeight: "700",
      color: colors.onSurface,
    },
    muted: {
      color: colors.onSurfaceVariant,
    },
    packagesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -spacing.xs / 2,
    },
    packageCard: {
      width: "50%",
      marginBottom: spacing.xs,
      paddingHorizontal: spacing.xs / 2,
      alignItems: "center",
      gap: spacing.xs,
    },
    packageName: {
      color: colors.onSurface,
      textAlign: "center",
    },
    packageAmount: {
      color: colors.onSurface,
      fontWeight: "700",
    },
    redeemCard: {
      gap: spacing.xs,
    },
    redeemTitle: {
      color: colors.onSurface,
    },
    input: {
      borderWidth: 2,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.onSurface,
      letterSpacing: 2,
    },
    error: {
      color: colors.error,
    },
    footerNote: {
      color: colors.onSurfaceVariant,
      textAlign: "center",
    },
  });
