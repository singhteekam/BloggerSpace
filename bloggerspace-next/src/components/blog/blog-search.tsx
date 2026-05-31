"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  initialValue?: string;
  preservedParams?: string; // serialised query string of params to keep (category, tag)
};

export function BlogSearch({ initialValue = "", preservedParams = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialValue);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const push = (q: string) => {
    const next = new URLSearchParams(preservedParams);
    next.delete("page");
    if (q) next.set("q", q);
    else next.delete("q");
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
