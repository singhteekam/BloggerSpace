"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutGrid, Tag, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  categories: string[];
  tags?: string[];
  defaultCategory?: string;
  defaultTag?: string;
  currentSearch?: string;
};

function MultiSelect({
  label,
  icon,
  options,
  selected,
  onToggle,
  onClear,
  onClose,
  prefix,
}: {
  label: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
  prefix?: string;
}) {
  const displayLabel =
    selected.length === 0
      ? `All ${label.toLowerCase()}s`
      : selected.length === 1
        ? `${prefix ?? ""}${selected[0]}`
        : `${selected.length} ${label.toLowerCase()}s`;

  return (
    <div className="flex min-w-40 flex-1 flex-col gap-1.5 sm:max-w-55">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </label>
      <Popover onOpenChange={(open) => { if (!open) onClose(); }}>
        <PopoverTrigger asChild>
          <button
            className={`flex h-9 w-full items-center justify-between rounded-md border px-3 text-sm transition-colors hover:bg-muted ${
              selected.length > 0
                ? "border-primary/60 bg-primary/5 text-foreground"
                : "border-input bg-background text-muted-foreground"
            }`}
          >
            <span className="truncate">{displayLabel}</span>
            <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="max-h-64 w-52 overflow-y-auto p-1" align="start">
          <button
            onClick={onClear}
            className={`flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted ${
              selected.length === 0 ? "font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            All {label.toLowerCase()}s
          </button>
          <div className="my-1 h-px bg-border" />
          {options.map((opt, i) => {
            const active = selected.includes(opt);
            return (
              <button
                key={`${opt}-${i}`}
                onClick={() => onToggle(opt)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded-sm border ${
                    active ? "border-primary bg-primary text-primary-foreground" : "border-input"
                  }`}
                >
                  {active && <Check className="size-3" />}
                </span>
                <span className="truncate">{prefix}{opt}</span>
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CategoryTabs({
  categories,
  tags = [],
  defaultCategory = "",
  defaultTag = "",
  currentSearch = "",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [localCategories, setLocalCategories] = useState<string[]>(() =>
    defaultCategory.split(",").filter(Boolean)
  );
  const [localTags, setLocalTags] = useState<string[]>(() =>
    defaultTag.split(",").filter(Boolean)
  );

  const pushURL = (cats: string[], ts: string[]) => {
    const next = new URLSearchParams();
    if (currentSearch) next.set("q", currentSearch);
    if (cats.length) next.set("category", cats.join(","));
    if (ts.length) next.set("tag", ts.join(","));
    const newQuery = next.toString();
    const currentQuery = new URLSearchParams(
      [
        currentSearch ? `q=${encodeURIComponent(currentSearch)}` : "",
        defaultCategory ? `category=${encodeURIComponent(defaultCategory)}` : "",
        defaultTag ? `tag=${encodeURIComponent(defaultTag)}` : "",
      ]
        .filter(Boolean)
        .join("&"),
    ).toString();
    if (newQuery !== currentQuery) {
      router.push(`${pathname}${newQuery ? `?${newQuery}` : ""}`);
    }
  };

  const toggleCategory = (cat: string) => {
    setLocalCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleTag = (tag: string) => {
    setLocalTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="flex flex-wrap gap-3">
      <MultiSelect
        label="Category"
        icon={<LayoutGrid className="size-3" />}
        options={categories}
        selected={localCategories}
        onToggle={toggleCategory}
        onClear={() => setLocalCategories([])}
        onClose={() => pushURL(localCategories, localTags)}
        prefix=""
      />
      {tags.length > 0 && (
        <MultiSelect
          label="Tag"
          icon={<Tag className="size-3" />}
          options={tags}
          selected={localTags}
          onToggle={toggleTag}
          onClear={() => setLocalTags([])}
          onClose={() => pushURL(localCategories, localTags)}
          prefix="#"
        />
      )}
    </div>
  );
}
