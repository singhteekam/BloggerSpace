"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Eye, Pencil, Clock, HardDrive, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { communityApi } from "@/lib/api/community";
import { CategoryCombobox } from "@/components/blog/category-combobox";
import { TagsInput } from "@/components/blog/tags-input";
import { TipTapEditor } from "@/components/editor/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [otherCategory, setOtherCategory] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  const submitPost = async () => {
    const plainText = content.replace(/<[^>]+>/g, "").trim();
    const effectiveCategory = category === "Other" ? otherCategory.trim() : category;
    if (!topic.trim() || !effectiveCategory || !plainText) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await communityApi.createPost(user._id, {
        communityPostSlug: slug || slugify(topic.trim()),
        communityPostTopic: topic.trim(),
        communityPostCategory: effectiveCategory,
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

  const authorName = user.fullName ?? user.userName ?? user.email;
  const effectiveCategoryDisplay = category === "Other" && otherCategory.trim() ? otherCategory.trim() : category;
  const previewReady =
    topic.trim() && effectiveCategoryDisplay && content.replace(/<[^>]+>/g, "").trim();


  const contentBytes = new Blob([content]).size;
  const contentKb = (contentBytes / 1024).toFixed(1);
  const sizeWarning = contentBytes > 200 * 1024;

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
            {effectiveCategoryDisplay && (
              <div className="mb-3">
                <Badge variant="secondary">{effectiveCategoryDisplay}</Badge>
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
        <form onSubmit={(e) => { e.preventDefault(); submitPost(); }} className="space-y-6">
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
            {/* Category combobox */}
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <CategoryCombobox value={category} onChange={setCategory} />
              {category === "Other" && (
                <div className="mt-2 space-y-1">
                  <Input
                    placeholder="Specify your category…"
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Required when "Other" is selected.</p>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label htmlFor="communityTagInput">
                Tags{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <TagsInput tags={tags} setTags={setTags} id="communityTagInput" />
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
            <div className={`flex min-w-0 flex-1 flex-wrap items-center gap-1.5 pt-0.5 text-xs ${sizeWarning ? "text-amber-500" : "text-muted-foreground"}`}>
              {sizeWarning ? <AlertTriangle className="size-3.5 shrink-0" /> : <HardDrive className="size-3.5 shrink-0" />}
              <span className="shrink-0">{contentKb} KB</span>
              {sizeWarning && (
                <span className="wrap-break-word">— Large content (inline images inflate size). Consider linking images by URL instead of uploading.</span>
              )}
            </div>
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
