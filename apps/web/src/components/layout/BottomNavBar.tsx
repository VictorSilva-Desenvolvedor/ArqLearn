import { Icon } from "@/components/ui/Icon";
import { NavLink } from "./NavLink";

// VIP fica de propósito no centro (a pedido do usuário: "no meio entre os dois", 2 itens de cada
// lado) — tone "gold" espelha o badge dourado do tab bar mobile (ver
// apps/mobile/src/app/(tabs)/_layout.tsx).
const items = [
  { href: "/", label: "Home", icon: "home", tone: "default" as const },
  { href: "/explorar", label: "Explorar", icon: "explore", tone: "default" as const },
  { href: "/vip", label: "VIP", icon: "crown", tone: "gold" as const },
  { href: "/liga", label: "Liga", icon: "leaderboard", tone: "default" as const },
  { href: "/perfil", label: "Perfil", icon: "person", tone: "default" as const },
];

export function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-md pb-2 pt-xs bg-surface-container-lowest rounded-t-xl border-t-2 border-outline-variant shadow-md md:hidden">
      {items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          variant="bottom"
          tone={item.tone}
          icon={<Icon name={item.icon} />}
          activeIcon={<Icon name={item.icon} filled />}
        />
      ))}
    </nav>
  );
}
