import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { radius } from "@/theme/tokens";
import { useColors } from "@/theme/useColors";
import type { ColorTokens } from "@/theme/tokens";

export default function TabsLayout() {
  const colors = useColors();
  const vipStyles = createVipStyles(colors);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarStyle: {
          backgroundColor: colors.surfaceBright,
          borderTopColor: colors.outlineVariant,
          borderTopWidth: 2,
        },
        // Transparente de propósito (a pedido do usuário): sem isso o container de cena do
        // bottom-tabs pinta um fundo opaco por baixo das 5 telas (que já viraram transparentes)
        // e o fundo animado (AnimatedBlueprintBackground, montado em app/_layout.tsx) não aparece.
        sceneStyle: { backgroundColor: "transparent" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="explorar"
        options={{
          title: "Explorar",
          tabBarIcon: ({ color, size }) => <Icon name="explore" size={size} color={String(color)} />,
        }}
      />
      {/* VIP fica de propósito no centro (a pedido do usuário: "no meio entre os dois", 2 abas de
          cada lado) — dourado sempre, ativo ou não, pra ler como destino premium e não só mais um
          item que "apaga" quando inativo igual aos outros. tabBar*TintColor globais (acima) só se
          aplicam ao texto do label das outras abas; sobrescritos aqui pra manter o rótulo VIP
          dourado nos dois estados. */}
      <Tabs.Screen
        name="vip"
        options={{
          title: "VIP",
          tabBarActiveTintColor: colors.secondary,
          tabBarInactiveTintColor: colors.secondary,
          tabBarIcon: ({ focused, size }) => (
            <View style={[vipStyles.badge, focused && vipStyles.badgeActive]}>
              <Icon name="crown" size={size - 6} color={focused ? colors.onSecondary : colors.secondary} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="liga"
        options={{
          title: "Liga",
          tabBarIcon: ({ color, size }) => <Icon name="league" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <Icon name="profile" size={size} color={String(color)} />,
        }}
      />
    </Tabs>
  );
}

const createVipStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    badge: {
      width: 30,
      height: 30,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondaryFixed,
    },
    badgeActive: {
      backgroundColor: colors.secondary,
    },
  });
