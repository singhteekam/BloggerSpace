"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BLOG_TAGS } from "@/lib/utils/blogCategories";

/**
 * Chip-style tags input with type-ahead suggestions — shared by every editor so the
 * behaviour is identical everywhere. Supports keyboard navigation: ↑/↓ highlight a
 * suggestion, Enter adds the highlighted suggestion (or the typed text if none is
 * highlighted), comma also adds, and Backspace on an empty field removes the last tag.
 *
 * Self-contained: the parent owns only the `tags` array; the in-progress text and the
 * suggestion highlight are internal.
 */
export function TagsInput({
  tags,
  setTags,
  allTags = BLOG_TAGS,
  max = 10,
  id = "tagInput",
}: {
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  allTags?: string[];
  max?: number;
  id?: string;
}) {
  const [input, setInput] = useState("");
  const [active, setActive] = useState(0);

  const suggestions =
    input.trim().length > 0 && tags.length < max
      ? allTags
          .filter((t) => t.toLowerCase().includes(input.toLowerCase()) && !tags.includes(t))
          .slice(0, 8)
      : [];

  useEffect(() => {
    setActive(0);
  }, [input]);

  const addTag = (raw?: string) => {
    const tag = (raw ?? input).trim();
    if (tag && !tags.includes(tag) && tags.length < max) {
      setTags((prev) => [...prev, tag]);
    }
    setInput("");
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && suggestions.length > 0) {
      e.preventDefault();
      setActive((i) =>
        e.key === "ArrowDown" ? Math.min(i + 1, suggestions.length - 1) : Math.max(i - 1, 0),
      );
      return;
    }
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      // Enter on a highlighted suggestion picks it; otherwise add the typed text.
      if (suggestions.length > 0 && suggestions[active]) addTag(suggestions[active]);
      else addTag();
      return;
    }
    if (e.key === "Backspace" && !input && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className="relative">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded hover:text-destructive"
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        {tags.length < max && (
          <input
            id={id}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => addTag(), 150)}
            placeholder={tags.length === 0 ? "Search or type a tag…" : ""}
            className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoComplete="off"
          />
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-md">
          {suggestions.map((s, idx) => (
            <button
              key={s}
              type="button"
              data-idx={idx}
              onMouseEnter={() => setActive(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
              }}
              className={`flex w-full items-center px-3 py-2 text-sm ${
                idx === active ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
