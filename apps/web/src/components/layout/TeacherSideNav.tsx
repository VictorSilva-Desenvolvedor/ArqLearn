import { Icon } from "@/components/ui/Icon";
import { NavLink } from "./NavLink";

export function TeacherSideNav() {
  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-16 bottom-0 w-64 bg-surface border-r-2 border-outline-variant pt-lg px-md gap-sm z-30">
      <NavLink
        href="/painel"
        label="Painel"
        variant="side"
        icon={<Icon name="dashboard" />}
        activeIcon={<Icon name="dashboard" filled />}
      />
      <div className="flex items-center gap-sm rounded-lg px-md py-sm font-body-lg text-body-lg text-outline cursor-default opacity-60">
        <Icon name="groups" />
        Turmas
        <span className="ml-auto font-label-caps text-label-caps">Em breve</span>
      </div>
      <NavLink
        href="/revisao/upload-bim-intro"
        label="Revisão"
        variant="side"
        icon={<Icon name="fact_check" />}
        activeIcon={<Icon name="fact_check" filled />}
      />
      <NavLink
        href="/perfil"
        label="Perfil"
        variant="side"
        icon={<Icon name="person" />}
        activeIcon={<Icon name="person" filled />}
      />
    </aside>
  );
}
