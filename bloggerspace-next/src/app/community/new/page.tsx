"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { X, Eye, Pencil, Clock } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { communityApi } from "@/lib/api/community";
import { BLOG_CATEGORIES } from "@/lib/utils/blogCategories";
import { TipTapEditor } from "@/components/editor/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import tagsData from "@/data/blogTags.json";

const ALL_TAGS = tagsData as string[];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+$/, "");
}

export default function NewCommunityPostPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [topic, setTopic] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  }, [tagInput, tags]);

  const tagSuggestions =
    tagInput.trim().length > 0
      ? ALL_TAGS.filter(
          (t) =>
            t.toLowerCase().includes(tagInput.toLowerCase()) &&
            !tags.includes(t),
        ).slice(0, 8)
      : [];

  if (isLoading || !user) return null;

  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !tagInput && tags.length)
      setTags((prev) => prev.slice(0, -1));
  };

  const submitPost = async () => {
    const plainText = content.replace(/<[^>]+>/g, "").trim();
    if (!topic.trim() || !category || !plainText) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await communityApi.createPost(user._id, {
        communityPostSlug: slug || slugify(topic.trim()),
        communityPostTopic: topic.trim(),
        communityPostCategory: category,
        communityPostContent: content.trim(),
      });
      toast.success("Discussion posted!");
      router.push("/community");
    } catch (err) {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to create post.")
          : "Error.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitPost();
  };

  const authorName = user.fullName ?? user.userName ?? user.email;
  const previewReady =
    topic.trim() && category && content.replace(/<[^>]+>/g, "").trim();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Start a discussion
        </h1>

        {/* Edit / Preview toggle */}
        <div className="flex gap-1 rounded-full border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "edit"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              if (!previewReady) {
                toast.error(
                  "Fill in the title, category, and description first.",
                );
                return;
              }
              setMode("preview");
            }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "preview"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="size-3.5" />
            Preview
          </button>
        </div>
      </div>

      {/* ── Preview mode ─────────────────────────────────────── */}
      {mode === "preview" && (
        <div className="space-y-6 rounded-xl border border-border bg-card p-6">
          <div>
            {category && (
              <div className="mb-3">
                <Badge variant="secondary">{category}</Badge>
              </div>
            )}
            <h2 className="font-serif text-2xl font-semibold leading-snug tracking-tight">
              {topic || "Untitled"}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>
                By{" "}
                <span className="font-medium text-foreground">{authorName}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                Just now
              </span>
              {slug && (
                <span className="text-xs font-mono opacity-60">/{slug}</span>
              )}
            </div>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <article
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          <Separator />

          <div className="flex gap-3 pt-1">
            <Button onClick={submitPost} disabled={submitting}>
              {submitting ? "Posting…" : "Post discussion"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode("edit")}
              disabled={submitting}
            >
              Back to edit
            </Button>
          </div>
        </div>
      )}

      {/* ── Edit mode ────────────────────────────────────────── */}
      {mode === "edit" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="topic">Title *</Label>
            <Input
              id="topic"
              placeholder="What's your question or topic?"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setSlug(slugify(e.target.value.trim()));
              }}
              required
              autoFocus
            />
          </div>

          {/* Slug (non-editable) */}
          <div className="space-y-1.5">
            <Label htmlFor="slug" className="flex items-center gap-1.5">
              Slug
              <span className="text-xs font-normal text-muted-foreground">
                (auto-generated)
              </span>
            </Label>
            <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <span className="select-none opacity-50">/community/</span>
              <span className="font-mono">
                {slug || (
                  <span className="italic opacity-50">
                    generated from title…
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Author (non-editable) */}
          <div className="space-y-1.5">
            <Label>Author</Label>
            <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium text-foreground">{authorName}</span>
              {user.userName && user.userName !== authorName && (
                <span className="text-muted-foreground">
                  @{user.userName}
                </span>
              )}
            </div>
          </div>

          {/* Category + Tags row */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a category…</option>
                {BLOG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label htmlFor="communityTagInput">
                Tags{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <div className="relative">
                <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 focus-within:ring-1 focus-within:ring-ring">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1 text-xs"
                    >
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
                  {tags.length < 10 && (
                    <input
                      id="communityTagInput"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={() => setTimeout(addTag, 150)}
                      placeholder={tags.length === 0 ? "Add tags…" : ""}
                      className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      autoComplete="off"
                    />
                  )}
                </div>

                {tagSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-md">
                    {tagSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!tags.includes(s) && tags.length < 10)
                            setTags((prev) => [...prev, s]);
                          setTagInput("");
                        }}
                        className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rich content editor */}
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <TipTapEditor
              content={content}
              onChange={setContent}
              placeholder="Describe your question, issue, or idea in detail…"
              minHeight="300px"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Posting…" : "Post discussion"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}
