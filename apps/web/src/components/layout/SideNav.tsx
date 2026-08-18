import { Icon } from "@/components/ui/Icon";
import { NavLink } from "./NavLink";

// P2 do /impeccable critique (18/08/2026): 8 itens num único nível excediam a diretriz de ≤5 por
// decisão e davam ao SideNav (desktop) uma arquitetura de informação diferente do BottomNavBar
// (mobile web) — a mesma divergência que deixou Notificações inalcançável abaixo de 768px até o
// P0 desta mesma rodada. Trimado pros mesmos 5 itens do BottomNavBar; Loja e Ajuda continuam
// alcançáveis via Perfil (apps/web/src/app/(shell)/perfil/page.tsx, mesmo padrão do
// apps/mobile) e Notificações via TopAppBar — nada ficou órfão, só parou de duplicar.
const items = [
  { href: "/", label: "Home", icon: "home", tone: "default" as const },
  { href: "/explorar", label: "Explorar", icon: "explore", tone: "default" as const },
  { href: "/vip", label: "VIP", icon: "crown", tone: "gold" as const },
  { href: "/liga", label: "Liga", icon: "leaderboard", tone: "default" as const },
  { href: "/perfil", label: "Perfil", icon: "person", tone: "default" as const },
];

export function SideNav() {
  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-16 bottom-0 w-64 bg-surface border-r-2 border-outline-variant pt-lg px-md gap-sm z-30">
      {items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          variant="side"
          tone={item.tone}
          icon={<Icon name={item.icon} />}
          activeIcon={<Icon name={item.icon} filled />}
        />
      ))}
    </aside>
  );
}
