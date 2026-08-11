import { Skeleton } from "@/components/ui/Skeleton";

export default function TeacherLoading() {
  return (
    <div className="max-w-container-max mx-auto px-lg py-section flex flex-col gap-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
