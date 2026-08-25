import { Icon } from "@/components/ui/Icon";
import { NavLink } from "./NavLink";

export function TeacherBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-md pb-2 pt-xs bg-surface-container-lowest rounded-t-xl border-t-2 border-outline-variant md:hidden">
      <NavLink
        href="/painel"
        label="Painel"
        variant="bottom"
        icon={<Icon name="dashboard" />}
        activeIcon={<Icon name="dashboard" filled />}
      />
      {/* Sem opacity-60: text-outline já é o cinza "desativado" do sistema, e a opacidade por cima
          derrubava o rótulo bem abaixo do piso de contraste — um item que continua sendo texto que
          alguém precisa conseguir ler pra entender que "Turmas" ainda não existe. */}
      <div className="flex flex-col items-center justify-center px-4 py-1 text-outline" aria-disabled="true">
        <Icon name="groups" className="mb-1 text-2xl" />
        <span className="font-label text-label-caps">Turmas</span>
        <span className="font-label text-label-caps">Em breve</span>
      </div>
      <NavLink
        href="/revisao/upload-bim-intro"
        label="Revisão"
        variant="bottom"
        icon={<Icon name="fact_check" />}
        activeIcon={<Icon name="fact_check" filled />}
      />
      <NavLink
        href="/perfil"
        label="Perfil"
        variant="bottom"
        icon={<Icon name="person" />}
        activeIcon={<Icon name="person" filled />}
      />
    </nav>
  );
}
