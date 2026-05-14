import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
      <div className="mt-16 flex flex-col items-center gap-6 text-center">
        <Skeleton className="h-7 w-44 rounded-full" />
        <Skeleton className="h-16 w-full max-w-2xl" />
        <Skeleton className="h-16 w-3/4 max-w-2xl" />
        <Skeleton className="h-5 w-full max-w-md" />
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-12 w-32 rounded-full" />
          <Skeleton className="h-12 w-32 rounded-full" />
        </div>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
