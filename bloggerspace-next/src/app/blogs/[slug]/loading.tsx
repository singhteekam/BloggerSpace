import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function BlogDetailLoading() {
  return (
    <main>
      <div className="mx-auto max-w-3xl px-6 pt-10 pb-8">
        <Skeleton className="mb-6 h-5 w-24" />
        <Skeleton className="mb-4 h-6 w-20 rounded-full" />
        <Skeleton className="mb-2 h-10 w-full" />
        <Skeleton className="mb-5 h-10 w-4/5" />
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
      </div>
      <Separator />
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 4 === 3 ? "w-3/4" : "w-full"}`} />
        ))}
        <div className="py-2" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={`b-${i}`} className={`h-4 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </main>
  );
}
