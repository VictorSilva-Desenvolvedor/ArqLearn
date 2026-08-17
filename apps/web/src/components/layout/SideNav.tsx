import { Icon } from "@/components/ui/Icon";
import { NavLink } from "./NavLink";

const items = [
  { href: "/", label: "Home", icon: "home", tone: "default" as const },
  { href: "/explorar", label: "Explorar", icon: "explore", tone: "default" as const },
  { href: "/vip", label: "VIP", icon: "crown", tone: "gold" as const },
  { href: "/liga", label: "Liga", icon: "leaderboard", tone: "default" as const },
  { href: "/perfil", label: "Perfil", icon: "person", tone: "default" as const },
  { href: "/loja", label: "Loja", icon: "storefront", tone: "default" as const },
  { href: "/notificacoes", label: "Notificações", icon: "notifications", tone: "default" as const },
  { href: "/ajuda", label: "Ajuda e Bugs", icon: "help", tone: "default" as const },
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
