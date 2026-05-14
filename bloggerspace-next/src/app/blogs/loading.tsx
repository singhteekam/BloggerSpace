import { Skeleton } from "@/components/ui/skeleton";

export default function BlogsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Skeleton className="mb-2 h-9 w-56" />
      <Skeleton className="mb-8 h-5 w-72" />
      <Skeleton className="mb-4 h-11 w-80" />
      <div className="mb-6 flex gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
