"use client";

import { useState, useRef, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BLOG_CATEGORIES } from "@/lib/utils/blogCategories";

/**
 * Searchable category selector — single source of truth used by every blog/community
 * editor (user new/edit, admin new/edit, reviewer, community) so the experience is
 * identical everywhere. Supports keyboard navigation: ↑/↓ move the highlight through
 * the visible (filtered) options and Enter selects the highlighted one.
 *
 * The parent owns the value and the "Other" free-text input; this component only
 * picks one of the known categories (including "Other").
 */
export function CategoryCombobox({
  value,
  onChange,
  categories = BLOG_CATEGORIES,
  placeholder = "Select category…",
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  categories?: string[];
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = search
    ? categories.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : categories;

  // Keep the highlight in range whenever the filter or open-state changes.
  useEffect(() => {
    setActive(0);
  }, [search, open]);

  // Scroll the highlighted option into view as the user arrows through.
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const select = (cat: string) => {
    onChange(cat);
    setOpen(false);
    setSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) select(filtered[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-(--radix-popover-trigger-width) overflow-hidden rounded-md border border-border bg-popover shadow-md"
          sideOffset={4}
          align="start"
        >
          <div className="border-b border-border p-2">
            <Input
              placeholder="Search categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div ref={listRef} className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No categories found.</p>
            ) : (
              filtered.map((cat, idx) => (
                <button
                  key={cat}
                  type="button"
                  data-idx={idx}
                  onClick={() => select(cat)}
                  onMouseEnter={() => setActive(idx)}
                  className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm ${
                    idx === active ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  <Check className={`size-3.5 shrink-0 ${value === cat ? "opacity-100" : "opacity-0"}`} />
                  {cat}
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
