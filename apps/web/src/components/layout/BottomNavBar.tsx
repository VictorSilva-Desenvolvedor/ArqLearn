import { Icon } from "@/components/ui/Icon";
import { NavLink } from "./NavLink";

const items = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/explorar", label: "Explorar", icon: "explore" },
  { href: "/liga", label: "Liga", icon: "leaderboard" },
  { href: "/perfil", label: "Perfil", icon: "person" },
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
          icon={<Icon name={item.icon} />}
          activeIcon={<Icon name={item.icon} filled />}
        />
      ))}
    </nav>
  );
}
