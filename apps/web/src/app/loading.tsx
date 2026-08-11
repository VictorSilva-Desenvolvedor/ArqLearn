import { Skeleton } from "@/components/ui/Skeleton";

// Fallback pra qualquer rota sem loading.tsx mais específico (ex.: /login) — grupos como
// (shell)/(lesson)/(teacher) e /admin têm o próprio, mais parecido com o conteúdo real deles.
export default function RootLoading() {
  return (
    <div className="flex-1 flex items-center justify-center px-md py-section">
      <Skeleton className="h-48 w-full max-w-[28rem] rounded-xl" />
    </div>
  );
}
