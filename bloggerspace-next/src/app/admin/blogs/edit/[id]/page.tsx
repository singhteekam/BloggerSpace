"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, Save, X, ChevronsUpDown, Check,
  Cloud, CloudOff, Eye, CheckCheck, FileMinus, Star,
} from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import * as Dialog from "@radix-ui/react-dialog";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminApi } from "@/lib/api/admin";
import { useAutoSave } from "@/hooks/use-autosave";
import { TipTapEditor } from "@/components/editor/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import categoryData from "@/data/blogCategory.json";
import tagsData from "@/data/blogTags.json";

const categories = (categoryData as { value: string; label: string }[]).map((c) => c.value);
const ALL_TAGS = tagsData as string[];

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: blogId } = use(params);
  const { user, isLoading: authLoading } = useRequireAdmin();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [tagInput, setTagInput] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [blogStatus, setBlogStatus] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");

  // UI dialogs
  const [showPreview, setShowPreview] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  const [catOpen, setCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const filteredCategories = catSearch
    ? categories.filter((c) => c.toLowerCase().includes(catSearch.toLowerCase()))
    : categories;

  useEffect(() => {
    if (!blogId || !user) return;
    adminApi.getAdminBlogForEdit(blogId, user._id)
      .then((res) => {
        const b = res.data;
        setTitle(b.title);
        const isKnownCat = categories.includes(b.category);
        if (isKnownCat) {
          setCategory(b.category);
        } else {
          setCategory("Other");
          setOtherCategory(b.category);
        }
        setTags(b.tags ?? []);
        setContent(b.content);
        setSlug(b.slug);
        setBlogStatus(b.status ?? "");
        setAuthorEmail((b.authorDetails as { email?: string })?.email ?? "");
        setEditorKey((k) => k + 1);
      })
      .catch(() => toast.error("Failed to load blog."))
      .finally(() => setLoading(false));
  }, [blogId, user]);

  // Slug auto-updates with title
  useEffect(() => {
    if (title) setSlug(toSlug(title));
  }, [title]);

  const buildPayload = useCallback(() => ({
    title,
    slug,
    content,
    category: category === "Other" ? otherCategory.trim() : category,
    tags,
  }), [title, slug, content, category, otherCategory, tags]);

  // Auto-save silently every 30s
  const { autoSaveStatus, lastSavedAt } = useAutoSave(
    async () => {
      if (!user || !title || !category) return;
      await adminApi.saveAdminBlogEdit(blogId, user._id, buildPayload());
    },
    { title, slug, category, tags, content },
    { canSave: !!user && !!title && !!category },
  );

  const handleSaveDraft = async () => {
    if (!user || !title || !category) return;
    setIsSaving(true);
    try {
      await adminApi.saveAdminBlogEdit(blogId, user._id, buildPayload());
      toast.success("Saved as draft.");
      router.push("/admin/dashboard");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Save failed.") : "Error saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (rating === 0) { toast.error("Please give a rating before publishing."); return; }
    if (!user || !title || !category || !content) return;
    if (category === "Other" && !otherCategory.trim()) {
      toast.error("Please specify your custom category.");
      return;
    }
    setIsPublishing(true);
    try {
      await adminApi.publishBlog(blogId, {
        slug,
        title,
        content,
        category,
        tags,
        rating,
        reviewRemarks: remarks || "Approved by admin.",
        userId: user._id,
        role: "Admin",
        email: user.email,
      });
      toast.success("Blog published!");
      setShowPublish(false);
      router.push("/admin/dashboard");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Publish failed.") : "Error publishing.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscard = async () => {
    if (!user) return;
    setIsDiscarding(true);
    try {
      await adminApi.discardBlog(blogId, user._id);
      toast.success("Blog discarded.");
      setShowDiscard(false);
      router.push("/admin/dashboard");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Discard failed.") : "Error.");
    } finally {
      setIsDiscarding(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) setTags((p) => [...p, tag]);
    setTagInput("");
  };
  const removeTag = (tag: string) => setTags((p) => p.filter((t) => t !== tag));
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
    if (e.key === "Backspace" && !tagInput && tags.length) setTags((p) => p.slice(0, -1));
  };

  if (authLoading || loading) return <EditorSkeleton />;
  if (!user) return null;

  const statusLabel = blogStatus.toLowerCase().replace(/_/g, " ");

  return (
    <>
      {/* Preview dialog */}
      <Dialog.Root open={showPreview} onOpenChange={setShowPreview}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="font-serif text-xl font-semibold">{title || "Preview"}</Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm"><X className="size-4" /></Button>
              </Dialog.Close>
            </div>
            <div
              className="blog-prose"
              dangerouslySetInnerHTML={{ __html: content || "<p class='text-muted-foreground'>No content yet.</p>" }}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Publish dialog */}
      <Dialog.Root open={showPublish} onOpenChange={setShowPublish}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <Dialog.Title className="font-serif text-lg font-semibold">Publish blog</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground line-clamp-2">
              &ldquo;{title}&rdquo;
            </Dialog.Description>
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setRatingHover(s)}
                      onMouseLeave={() => setRatingHover(0)}
                    >
                      <Star className={`size-7 transition-colors ${s <= (ratingHover || rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium">Review remarks (optional)</p>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Final notes for the author…"
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close asChild><Button variant="outline" size="sm">Cancel</Button></Dialog.Close>
              <Button size="sm" disabled={isPublishing || rating === 0} onClick={handlePublish} className="gap-1.5">
                {isPublishing ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
                Publish
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Discard dialog */}
      <Dialog.Root open={showDiscard} onOpenChange={setShowDiscard}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <Dialog.Title className="font-serif text-lg font-semibold">Discard blog?</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              Move &ldquo;{title}&rdquo; to the discard queue. The author will be notified.
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close asChild><Button variant="outline" size="sm">Cancel</Button></Dialog.Close>
              <Button variant="destructive" size="sm" disabled={isDiscarding} onClick={handleDiscard} className="gap-1.5">
                {isDiscarding ? <Loader2 className="size-3.5 animate-spin" /> : <FileMinus className="size-3.5" />}
                Discard
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4 flex-wrap">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/admin/dashboard"><ArrowLeft className="size-4" />Dashboard</Link>
          </Button>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Review blog</h1>
          <div className="ml-auto flex items-center gap-3">
            {blogStatus && (
              <Badge variant="outline" className="text-xs capitalize">{statusLabel}</Badge>
            )}
            {authorEmail && (
              <span className="text-xs text-muted-foreground">Author: <span className="font-medium text-foreground">{authorEmail}</span></span>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Blog title…"
              className="text-lg"
            />
            {slug && (
              <p className="text-xs text-muted-foreground">
                /blogs/<span className="font-medium text-foreground">{slug}</span>
              </p>
            )}
          </div>

          {/* Category + Tags */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Category combobox */}
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Popover.Root open={catOpen} onOpenChange={setCatOpen}>
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <span className={category ? "text-foreground" : "text-muted-foreground"}>
                      {category || "Select category…"}
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
                        value={catSearch}
                        onChange={(e) => setCatSearch(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                      {filteredCategories.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No categories found.</p>
                      ) : filteredCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => { setCategory(cat); setCatOpen(false); setCatSearch(""); }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          <Check className={`size-3.5 shrink-0 ${category === cat ? "opacity-100" : "opacity-0"}`} />
                          {cat}
                        </button>
                      ))}
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
              {category === "Other" && (
                <div className="space-y-1">
                  <Input
                    placeholder="Specify your category…"
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Required when "Other" is selected.</p>
                </div>
              )}
            </div>

            {/* Tags chip input */}
            <div className="space-y-1.5">
              <Label>
                Tags{" "}
                <span className="text-xs font-normal text-muted-foreground">(optional · max 10)</span>
              </Label>
              <div className="relative">
                <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="rounded hover:text-destructive">
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                  {tags.length < 10 && (
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={() => setTimeout(addTag, 150)}
                      placeholder={tags.length === 0 ? "Type a tag…" : ""}
                      className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      autoComplete="off"
                    />
                  )}
                </div>
                {tagInput.trim().length > 0 && tags.length < 10 && (() => {
                  const suggestions = ALL_TAGS.filter(
                    (t) => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t)
                  ).slice(0, 8);
                  if (!suggestions.length) return null;
                  return (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-md">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (!tags.includes(s) && tags.length < 10) setTags((p) => [...p, s]);
                            setTagInput("");
                          }}
                          className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="space-y-1.5">
            <Label>Content</Label>
            <TipTapEditor
              key={editorKey}
              content={content}
              onChange={setContent}
              placeholder="Blog content…"
              minHeight="520px"
            />
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between border-t border-border pt-6 gap-4 flex-wrap">
            <AutoSaveIndicator status={autoSaveStatus} lastSavedAt={lastSavedAt} />

            <div className="flex items-center gap-2 flex-wrap">
              {/* Preview */}
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview(true)} className="gap-1.5">
                <Eye className="size-4" />
                Preview
              </Button>

              {/* Save as draft */}
              <Button
                type="button"
                variant="outline"
                disabled={isSaving || !title || !category}
                onClick={handleSaveDraft}
                className="gap-2"
              >
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save as draft
              </Button>

              {/* Discard */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDiscard(true)}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <FileMinus className="size-4" />
                Discard
              </Button>

              {/* Publish */}
              <Button
                type="button"
                disabled={!title || !category || !content}
                onClick={() => setShowPublish(true)}
                className="gap-2"
              >
                <CheckCheck className="size-4" />
                Publish
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function AutoSaveIndicator({ status, lastSavedAt }: { status: string; lastSavedAt: Date | null }) {
  if (status === "idle") return <span />;
  if (status === "saving")
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Auto-saving…
      </span>
    );
  if (status === "error")
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <CloudOff className="size-3" /> Auto-save failed
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Cloud className="size-3" />
      Saved {lastSavedAt ? lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
    </span>
  );
}

function EditorSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-11 w-full rounded-md" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-10 rounded-md" />
        <Skeleton className="h-10 rounded-md" />
      </div>
      <Skeleton className="h-130 w-full rounded-xl" />
    </div>
  );
}
