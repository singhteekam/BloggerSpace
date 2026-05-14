"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { api } from "@/lib/api/client";

export function VisitorBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const key = "bs_visitor_counted";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      api.post("/api/users/addvisitor").catch(() => {});
    }

    api
      .get<{ count: number }>("/api/users/visitors")
      .then((res) => setCount(res.data.count))
      .catch(() => {});
  }, []);

  if (count === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
      <Eye className="size-3" />
      {count.toLocaleString()} visitors
    </span>
  );
}
