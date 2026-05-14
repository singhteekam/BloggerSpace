"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LayoutGrid, Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = { categories: string[]; tags?: string[] };

export function CategoryTabs({ categories, tags = [] }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeCategory = params.get("category") ?? "";
  const activeTag = params.get("tag") ?? "";

  const selectCategory = (value: string) => {
    const next = new URLSearchParams(params.toString());
    next.delete("tag");
    next.delete("page");
    if (value === "__all__") next.delete("category");
    else next.set("category", value);
    router.push(`${pathname}?${next.toString()}`);
  };

  const selectTag = (value: string) => {
    const next = new URLSearchParams(params.toString());
    next.delete("category");
    next.delete("page");
    if (value === "__all__") next.delete("tag");
    else next.set("tag", value);
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {/* Category dropdown */}
      <div className="flex min-w-40 flex-1 flex-col gap-1.5 sm:max-w-55">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <LayoutGrid className="size-3" />
          Category
        </label>
        <Select value={activeCategory || "__all__"} onValueChange={selectCategory}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tag dropdown — only rendered when tags exist */}
      {tags.length > 0 && (
        <div className="flex min-w-40 flex-1 flex-col gap-1.5 sm:max-w-55">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Tag className="size-3" />
            Tag
          </label>
          <Select value={activeTag || "__all__"} onValueChange={selectTag}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  #{tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
