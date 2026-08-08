"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import type { TeacherClass } from "@/lib/api/mocks/fixtures/teacherAnalytics";

interface ClassSelectorProps {
  classes: TeacherClass[];
  selectedClassId: string;
  onSelect: (classId: string) => void;
}

export function ClassSelector({ classes, selectedClassId, onSelect }: ClassSelectorProps) {
  const selected = classes.find((c) => c.id === selectedClassId);

  return (
    <DropdownMenu
      trigger={
        <Button variant="ghost" size="sm" icon={<Icon name="expand_more" />}>
          {selected?.name ?? "Selecionar turma"}
        </Button>
      }
    >
      {classes.map((c) => (
        <DropdownMenuItem key={c.id} onSelect={() => onSelect(c.id)} active={c.id === selectedClassId}>
          {c.name}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}
