import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { TopAppBar } from "@/components/home/TopAppBar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/http";
import { getVipStatus, redeemVipCoupon } from "@/lib/api/resources/vip";
import { colors, radius, spacing, type as typeTokens } from "@/theme/tokens";
import type { VipStatus } from "@/types/api";

// Tela VIP "Mestre Arquiteto" (a pedido do usuário), adaptada do mockup "Assinatura VIP" pros
// tokens reais do app. Aba de primeiro nível (não mais tela empilhada) — usuário pediu pra VIP
// ficar na bottom nav, no centro entre Explorar e Liga, ver (tabs)/_layout.tsx — por isso usa
// TopAppBar (mesmo cabeçalho das outras abas) em vez de um botão "Voltar". Dois caminhos de
// ativação: cupom de 10 dígitos (funcional) e assinatura recorrente (desabilitada nesta fase —
// sem gateway de pagamento integrado, ver services/monolith/internal/gamification/vip.go
// VIPSubscriptionsEnabled).
const BENEFITS: { icon: IconName; title: string; description: string }[] = [
  {
    icon: "chest",
    title: "Baú Semanal Garantido",
    description: "Seu Baú Semanal sempre vem com um Bloqueio de Ofensiva garantido, sem sorteio.",
  },
  {
    icon: "bolt",
    title: "+25% de XP",
    description: "Todo XP ganho em respostas certas recebe um bônus de 25%.",
  },
  {
    icon: "replay",
    title: "Resets Extras",
    description: "1 reset a mais no Baú Diário por dia e 2 resets a mais no Baú Semanal por ciclo.",
  },
  {
    icon: "crown",
    title: "Perfil de Mestre Arquiteto",
    description: "Coroa, nome em destaque e selo exclusivo no seu perfil.",
  },
];

function formatExpiresAt(iso: string | null): string {
  if (!iso) return "Vitalício";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function VipScreen() {
  const { gamification, updateGamification } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState<VipStatus | null>(null);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVipStatus().then((s) => {
      if (!cancelled) setStatus(s);
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
      const result = await redeemVipCoupon(code.trim());
      updateGamification({ is_vip: result.is_vip, vip_expires_at: result.vip_expires_at });
      setStatus((current) => (current ? { ...current, is_vip: result.is_vip, vip_expires_at: result.vip_expires_at } : current));
      setCode("");
      showToast("VIP ativado! Bem-vindo, Mestre Arquiteto.", "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível resgatar o cupom agora.");
    } finally {
      setRedeeming(false);
    }
  };

  const isVip = gamification.is_vip;

  return (
    <View style={styles.screen}>
      <TopAppBar />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.crownBadge}>
            <Icon name="crown" size={40} color={colors.onSecondary} />
          </View>
          <Text style={[typeTokens.displayLg, styles.title]}>Mestre Arquiteto</Text>
          <Text style={[typeTokens.bodyLg, styles.subtitle]}>
            Eleve sua jornada com baús garantidos, mais XP e um perfil de destaque.
          </Text>
        </View>

        {isVip ? (
          <Card padding="lg" style={styles.statusCard}>
            <Badge tone="gold" children="VIP Ativo" />
            <Text style={[typeTokens.headlineMd, styles.statusTitle]}>Sua assinatura está ativa</Text>
            <Text style={[typeTokens.bodyMd, styles.statusExpiry]}>
              Válido até: {formatExpiresAt(gamification.vip_expires_at)}
            </Text>
            {status && (
              <Text style={[typeTokens.bodySm, styles.statusResets]}>
                Resets disponíveis: {status.daily_chest_resets_max - status.daily_chest_resets_used} diário ·{" "}
                {status.weekly_chest_resets_max - status.weekly_chest_resets_used} semanal
              </Text>
            )}
          </Card>
        ) : null}

        <View style={styles.benefitsGrid}>
          {BENEFITS.map((benefit) => (
            <Card key={benefit.title} padding="md" style={styles.benefitCard}>
              <Icon name={benefit.icon} size={32} color={colors.secondary} />
              <Text style={[typeTokens.questionSm, styles.benefitTitle]}>{benefit.title}</Text>
              <Text style={[typeTokens.bodySm, styles.benefitDescription]}>{benefit.description}</Text>
            </Card>
          ))}
        </View>

        {!isVip && (
          <Card padding="lg" style={styles.redeemCard}>
            <Text style={[typeTokens.questionLg, styles.redeemTitle]}>Já tenho um cupom</Text>
            <Text style={[typeTokens.bodySm, styles.redeemDescription]}>
              Digite o código de 10 dígitos que você recebeu.
            </Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
              keyboardType="number-pad"
              maxLength={10}
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
              {redeeming ? "Resgatando…" : "Resgatar Cupom"}
            </Button>
          </Card>
        )}

        {!isVip && (
          <Card padding="lg" style={styles.subscribeCard}>
            <Text style={[typeTokens.questionLg, styles.redeemTitle]}>Torne-se Mestre Arquiteto</Text>
            <View style={styles.priceRow}>
              <Text style={[typeTokens.displayLg, styles.price]}>R$ 29,90</Text>
              <Text style={[typeTokens.bodyMd, styles.pricePeriod]}>/ mês</Text>
            </View>
            <Button variant="primary" fullWidth disabled>
              Assinar — Em breve
            </Button>
            <Text style={[typeTokens.bodySm, styles.subscribeNote]}>
              Assinatura por cartão ainda não está disponível. Use um cupom por enquanto.
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  hero: {
    alignItems: "center",
    gap: spacing.xs,
  },
  crownBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.secondary,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
  statusCard: {
    alignItems: "center",
    gap: spacing.xs,
    borderColor: colors.secondary,
  },
  statusTitle: {
    color: colors.onSurface,
  },
  statusExpiry: {
    color: colors.onSurfaceVariant,
  },
  statusResets: {
    color: colors.onSurfaceVariant,
  },
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs / 2,
  },
  benefitCard: {
    width: "50%",
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs / 2,
    gap: 4,
  },
  benefitTitle: {
    color: colors.onSurface,
  },
  benefitDescription: {
    color: colors.onSurfaceVariant,
  },
  redeemCard: {
    gap: spacing.xs,
  },
  redeemTitle: {
    color: colors.onSurface,
  },
  redeemDescription: {
    color: colors.onSurfaceVariant,
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
  subscribeCard: {
    alignItems: "center",
    gap: spacing.xs,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  price: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  pricePeriod: {
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  subscribeNote: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
});
