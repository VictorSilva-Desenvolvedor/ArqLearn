import { Skeleton } from "@/components/ui/Skeleton";

export default function LessonLoading() {
  return (
    <div className="max-w-2xl mx-auto w-full px-md py-lg flex flex-col gap-lg flex-1">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-8 w-3/4" />
      <div className="flex flex-col gap-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
