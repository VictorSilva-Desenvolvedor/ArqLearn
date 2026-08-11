import { Skeleton } from "@/components/ui/Skeleton";

export default function ShellLoading() {
  return (
    <div className="max-w-container-max mx-auto px-lg py-section flex flex-col gap-lg">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="flex flex-col gap-sm">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
