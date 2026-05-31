import { Skeleton } from "@/components/ui/skeleton";

export default function BlogsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <Skeleton className="mb-2 h-9 w-56" />
      <Skeleton className="mb-8 h-5 w-72" />

      {/* Search bar */}
      <Skeleton className="mb-4 h-10 w-full max-w-sm" />

      {/* Filter dropdowns */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex min-w-40 flex-1 flex-col gap-1.5 sm:max-w-55">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex min-w-40 flex-1 flex-col gap-1.5 sm:max-w-55">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      {/* Blog grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
