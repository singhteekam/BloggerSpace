"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function BlogSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync with URL on external navigation
  useEffect(() => {
    setValue(params.get("q") ?? "");
  }, [params]);

  const push = (q: string) => {
    const next = new URLSearchParams(params.toString());
    if (q) {
      next.set("q", q);
    } else {
      next.delete("q");
    }
    next.delete("page"); // reset pagination on new search
    router.push(`${pathname}?${next.toString()}`);
  };

  const handleChange = (v: string) => {
    setValue(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push(v), 400);
  };

  const clear = () => {
    setValue("");
    push("");
  };

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search blogs…"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-9 pr-9"
      />
      {value && (
        <button
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
