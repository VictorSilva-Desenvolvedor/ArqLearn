"use client";

import { Icon } from "@/components/ui/Icon";
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/DropdownMenu";
import { themeCatalog, type ThemeDefinition } from "@/lib/api/mocks/fixtures/themes";
import { useTheme } from "@/hooks/useTheme";

// Agrupado por disponibilidade (não mais por bimestre/semestre) — a pedido do usuário,
// 19/08/2026: o que importa pra escolher um tema é se dá pra estudar agora ou não, não em qual
// semestre a matéria cai. Espelha apps/mobile/src/components/home/ThemeSelector.tsx.
const available = themeCatalog.filter((t) => t.hasContent);
const underConstruction = themeCatalog.filter((t) => !t.hasContent);

export function ThemeSelector() {
  const { theme, setTopic } = useTheme();

  return (
    <DropdownMenu
      trigger={
        <button
          type="button"
          aria-label={`Trocar de matéria — atual: ${theme.label}`}
          className="flex items-center gap-1.5 font-label text-label-caps text-primary bg-surface-bright hover:bg-primary-fixed transition-colors px-3 py-1.5 rounded-full border-2 border-primary"
        >
          <Icon name={theme.icon} filled className="text-base" />
          <span className="hidden lg:inline max-w-40 truncate font-bold">{theme.label}</span>
          <Icon name="expand_more" className="text-base" />
        </button>
      }
    >
      <ThemeGroup label="Disponíveis" themes={available} activeTopic={theme.topic} onSelect={setTopic} />
      {available.length > 0 && underConstruction.length > 0 && <DropdownMenuSeparator />}
      <ThemeGroup label="Em construção" themes={underConstruction} activeTopic={theme.topic} onSelect={setTopic} />
    </DropdownMenu>
  );
}

function ThemeGroup({
  label,
  themes,
  activeTopic,
  onSelect,
}: {
  label: string;
  themes: ThemeDefinition[];
  activeTopic: string;
  onSelect: (topic: string) => void;
}) {
  if (themes.length === 0) return null;
  return (
    <>
      <DropdownMenuLabel>{label}</DropdownMenuLabel>
      {themes.map((entry) => (
        <DropdownMenuItem
          key={entry.topic}
          onSelect={() => onSelect(entry.topic)}
          active={entry.topic === activeTopic}
          disabled={!entry.hasContent}
        >
          <span className="flex items-center gap-2">
            <Icon
              name={entry.hasContent ? entry.icon : "lock"}
              filled={entry.topic === activeTopic}
              className="text-base"
            />
            <span className="flex-1">{entry.label}</span>
            {!entry.hasContent && (
              <span className="font-label text-label-caps uppercase text-error shrink-0">
                Em construção
              </span>
            )}
          </span>
        </DropdownMenuItem>
      ))}
    </>
  );
}
