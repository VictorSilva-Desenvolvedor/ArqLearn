import { Icon } from "@/components/ui/Icon";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="flex items-center gap-sm bg-surface-gray border-2 border-outline-variant rounded-xl px-md py-sm">
      <Icon name="search" className="text-on-surface-variant" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Pesquisar trilhas, tópicos ou materiais..."
        className="flex-1 bg-transparent outline-none font-body-lg text-body-lg text-on-surface placeholder:text-on-surface-variant"
      />
    </div>
  );
}
