"use client";

import { Icon } from "@/components/ui/Icon";
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/DropdownMenu";
import { themeCatalog } from "@/lib/api/mocks/fixtures/themes";
import { useTheme } from "@/hooks/useTheme";

const featured = themeCatalog.filter((t) => t.semester === undefined);
const bySemester = Array.from({ length: 10 }, (_, i) => i + 1).map((semester) => ({
  semester,
  themes: themeCatalog.filter((t) => t.semester === semester),
}));

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
      <DropdownMenuLabel>Trilhas em destaque</DropdownMenuLabel>
      {featured.map((entry) => (
        <DropdownMenuItem
          key={entry.topic}
          onSelect={() => setTopic(entry.topic)}
          active={entry.topic === theme.topic}
          disabled={!entry.hasContent}
        >
          <span className="flex items-center gap-2">
            <Icon
              name={entry.hasContent ? entry.icon : "lock"}
              filled={entry.topic === theme.topic}
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

      {bySemester.map(
        ({ semester, themes }) =>
          themes.length > 0 && (
            <div key={semester}>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{semester}º Semestre</DropdownMenuLabel>
              {themes.map((entry) => (
                <DropdownMenuItem
                  key={entry.topic}
                  onSelect={() => setTopic(entry.topic)}
                  active={entry.topic === theme.topic}
                  disabled={!entry.hasContent}
                >
                  <span className="flex items-center gap-2">
                    <Icon
                      name={entry.hasContent ? entry.icon : "lock"}
                      filled={entry.topic === theme.topic}
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
            </div>
          ),
      )}
    </DropdownMenu>
  );
}
