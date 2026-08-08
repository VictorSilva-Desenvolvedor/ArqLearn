import { Tabs } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { colors } from "@/theme/tokens";

export default function TabsLayout() {
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
