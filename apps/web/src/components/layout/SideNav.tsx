import { Icon } from "@/components/ui/Icon";
import { NavLink } from "./NavLink";

const items = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/explorar", label: "Explorar", icon: "explore" },
  { href: "/liga", label: "Liga", icon: "leaderboard" },
  { href: "/perfil", label: "Perfil", icon: "person" },
  { href: "/loja", label: "Loja", icon: "storefront" },
  { href: "/notificacoes", label: "Notificações", icon: "notifications" },
  { href: "/ajuda", label: "Ajuda e Bugs", icon: "help" },
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
          icon={<Icon name={item.icon} />}
          activeIcon={<Icon name={item.icon} filled />}
        />
      ))}
    </aside>
  );
}
