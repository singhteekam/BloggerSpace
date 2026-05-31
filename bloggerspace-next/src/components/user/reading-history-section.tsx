"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, ChevronRight } from "lucide-react";
import { userApi } from "@/lib/api/user";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const IST = "Asia/Kolkata";
function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleString("en-IN", {
      timeZone: IST, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch {
    return "";
  }
}

export function ReadingHistorySection({ enabled }: { enabled: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["reading-history"],
    queryFn: () => userApi.getReadingHistory().then((r) => r.data.history),
    enabled,
    staleTime: 60 * 1000,
  });

  const history = data ?? [];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <BookOpen className="size-4 text-muted-foreground" />
          Reading history
        </p>
        {history.length > 0 && (
          <p className="text-xs text-muted-foreground">Last {history.length} read</p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
          <BookOpen className="size-6" />
          <p className="text-sm">No reading history yet. Blogs you read will show up here.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {history.map((h, i) => (
            <Link
              key={`${h.slug}-${i}`}
              href={`/blogs/${h.slug}`}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{h.title}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  {h.category && <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{h.category}</Badge>}
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {fmt(h.readAt)}
                  </span>
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
