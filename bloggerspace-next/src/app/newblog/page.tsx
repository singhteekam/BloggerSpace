"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  ChevronsUpDown,
  Check,
  Pencil,
  Send,
  Eye,
  Sparkles,
  HardDrive,
  AlertTriangle,
  Cloud,
  CloudOff,
  Gem,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as Popover from "@radix-ui/react-popover";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAutoSave } from "@/hooks/use-autosave";
import { blogWriteApi } from "@/lib/api/blog-write";
import { TipTapEditor } from "@/components/editor/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BLOG_CATEGORIES, BLOG_TAGS } from "@/lib/utils/blogCategories";

const categories = BLOG_CATEGORIES;
const ALL_TAGS = BLOG_TAGS;

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
});

type FormValues = z.infer<typeof schema>;

/* ─── inner form (needs useSearchParams) ─────────────────────────── */
function NewBlogForm() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Admins must use the admin write page so blogs get ADMIN_DRAFT status, not DRAFT.
  useEffect(() => {
    if (!authLoading && user?.role?.toLowerCase() === "admin") {
      router.replace("/admin/adminblogs/write");
    }
  }, [user, authLoading, router]);

  const [content, setContent] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [slug, setSlug] = useState("");
  const [titleStatus, setTitleStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editAuthorName, setEditAuthorName] = useState<string | null>(null);

  const [otherCategory, setOtherCategory] = useState("");

  // Category combobox state
  const [catOpen, setCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const titleValue = watch("title", "");
  const categoryValue = watch("category", "");

  // Silent auto-save (edit mode only — new blogs need a manual first draft to get an ID)
  const autoSaveFn = useCallback(async () => {
    if (!user || !editId || !titleValue || !categoryValue) return;
    const effectiveCategory = categoryValue === "Other" ? otherCategory.trim() : categoryValue;
    if (!effectiveCategory) return;
    await blogWriteApi.update(editId, {
      slug: toSlug(titleValue),
      title: titleValue,
      content,
      category: effectiveCategory,
      tags,
    });
  }, [user, editId, titleValue, categoryValue, otherCategory, content, tags]);

  const { autoSaveStatus, lastSavedAt } = useAutoSave(
    autoSaveFn,
    { title: titleValue, category: categoryValue, otherCategory, tags, content },
    { canSave: !!editId && !!user && !!titleValue && !!categoryValue },
  );

  // Slug
  useEffect(() => {
    setSlug(toSlug(titleValue));
  }, [titleValue]);

  // Title uniqueness check (debounced 600 ms)
  // In edit mode, pass the blog's own _id so the backend excludes it from the check
  useEffect(() => {
    if (!titleValue || titleValue.length < 3) {
      setTitleStatus("idle");
      return;
    }
    setTitleStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await blogWriteApi.checkTitle(titleValue, editId ?? undefined);
        setTitleStatus(res.data.message === "Available" ? "available" : "taken");
      } catch {
        setTitleStatus("idle");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [titleValue, editId]);

  // Load blog for edit mode
  useEffect(() => {
    if (!editId || !user) return;
    setLoadingEdit(true);
    blogWriteApi
      .getForEdit(editId)
      .then((res) => {
        const blog = res.data;
        setValue("title", blog.title);
        const isKnownCat = categories.includes(blog.category);
        if (isKnownCat) {
          setValue("category", blog.category);
        } else {
          setValue("category", "Other");
          setOtherCategory(blog.category);
        }
        setTags(blog.tags ?? []);
        setSlug(blog.slug);
        setContent(blog.content);
        setEditorKey((k) => k + 1);
        const author = blog.authorDetails;
        if (author) {
          setEditAuthorName(author.fullName ?? author.userName ?? author.email ?? null);
        }
      })
      .catch(() => toast.error("Failed to load blog for editing."))
      .finally(() => setLoadingEdit(false));
  }, [editId, user, setValue]);

  // Tag input
  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  }, [tagInput, tags]);

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const generateWithAI = async () => {
    if (!titleValue || titleValue.trim().length < 3) {
      toast.error("Enter a title (at least 3 characters) before generating.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await blogWriteApi.generateAI(titleValue.trim());
      setContent(res.data.html);
      setEditorKey((k) => k + 1);
      toast.success("AI content generated! Review and edit before submitting.");
    } catch {
      toast.error("AI generation failed. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  // Filtered category list
  const filteredCategories = catSearch
    ? categories.filter((c) => c.toLowerCase().includes(catSearch.toLowerCase()))
    : categories;

  const buildPayload = (data: FormValues) => ({
    slug,
    title: data.title,
    content,
    category: data.category === "Other" ? otherCategory.trim() : data.category,
    tags,
    userId: user!._id,
    authorEmail: user!.email,
  });

  const saveDraft = handleSubmit(async (data) => {
    if (!user) return;
    const effectiveCategory = data.category === "Other" ? otherCategory.trim() : data.category;
    setIsSavingDraft(true);
    try {
      if (editId) {
        await blogWriteApi.update(editId, { slug, title: data.title, content, category: effectiveCategory, tags });
        toast.success("Changes saved.");
      } else {
        await blogWriteApi.saveDraft(buildPayload(data));
        toast.success("Saved as draft.");
      }
      router.push("/myblogs");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed to save.") : "Error saving.");
    } finally {
      setIsSavingDraft(false);
    }
  });

  const submitForReview = handleSubmit(async (data) => {
    if (!user) return;
    if (data.category === "Other" && !otherCategory.trim()) {
      toast.error("Please specify your custom category.");
      return;
    }
    const effectiveCategory = data.category === "Other" ? otherCategory.trim() : data.category;
    if (!content || content.replace(/<[^>]+>/g, "").trim() === "") {
      toast.error("Content cannot be empty.");
      return;
    }
    if (titleStatus === "taken") {
      toast.error("Title is already taken. Please choose a different one.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editId) {
        await blogWriteApi.update(editId, { slug, title: data.title, content, category: effectiveCategory, tags });
        toast.success("Blog submitted for review.");
      } else {
        await blogWriteApi.create(buildPayload(data));
        toast.success("Blog submitted for review! We'll notify you by email.");
      }
      router.push("/myblogs");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed to submit.") : "Error submitting.");
    } finally {
      setIsSubmitting(false);
    }
  });

  if (authLoading || loadingEdit) return <EditorSkeleton />;
  if (!user) return null;

  const contentBytes = new Blob([content]).size;
  const contentKb = (contentBytes / 1024).toFixed(1);
  const sizeWarning = contentBytes > 200 * 1024; // warn if > 200 KB (images inflate this)

  return (
    <>
    {/* Preview dialog */}
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{watch("title") || "Preview"}</DialogTitle>
        </DialogHeader>
        <div
          className="blog-prose mt-2"
          dangerouslySetInnerHTML={{ __html: content || "<p class='text-muted-foreground'>No content yet.</p>" }}
        />
      </DialogContent>
    </Dialog>

    <main className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4 flex-wrap">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/myblogs">
            <ArrowLeft className="size-4" />
            My blogs
          </Link>
        </Button>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          {editId ? "Edit blog" : "Write a new blog"}
        </h1>
        {editAuthorName && (
          <span className="ml-auto text-sm text-muted-foreground">
            Author: <span className="font-medium text-foreground">{editAuthorName}</span>
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Give your post a compelling title…"
            className="text-lg"
            {...register("title")}
          />
          {/* Slug + status row */}
          <div className="flex items-center justify-between gap-2">
            {slug ? (
              <p className="text-xs text-muted-foreground truncate">
                /blogs/<span className="font-medium text-foreground">{slug}</span>
              </p>
            ) : (
              <span />
            )}
            <TitleStatus status={titleStatus} />
          </div>
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Category + Tags row */}
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
                  <span className={categoryValue ? "text-foreground" : "text-muted-foreground"}>
                    {categoryValue || "Select category…"}
                  </span>
                  <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-border bg-popover shadow-md"
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
                    ) : (
                      filteredCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setValue("category", cat, { shouldValidate: true });
                            setCatOpen(false);
                            setCatSearch("");
                          }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          <Check
                            className={`size-3.5 shrink-0 ${categoryValue === cat ? "opacity-100" : "opacity-0"}`}
                          />
                          {cat}
                        </button>
                      ))
                    )}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
            {categoryValue === "Other" && (
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

          {/* Tags chip input with suggestions */}
          <div className="space-y-1.5">
            <Label htmlFor="tagInput">
              Tags{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (optional · press Enter or comma · custom tags allowed)
              </span>
            </Label>
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
                {tags.length < 10 && (
                  <input
                    id="tagInput"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => setTimeout(addTag, 150)}
                    placeholder={tags.length === 0 ? "Search or type a tag…" : ""}
                    className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    autoComplete="off"
                  />
                )}
              </div>

              {/* Suggestions dropdown */}
              {tagInput.trim().length > 0 && tags.length < 10 && (() => {
                const suggestions = ALL_TAGS.filter(
                  (t) =>
                    t.toLowerCase().includes(tagInput.toLowerCase()) &&
                    !tags.includes(t)
                ).slice(0, 8);
                if (suggestions.length === 0) return null;
                return (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-md">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!tags.includes(s) && tags.length < 10) {
                            setTags((prev) => [...prev, s]);
                          }
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
            <p className="text-xs text-muted-foreground">
              {tags.length}/10 tags · Type anything to search suggestions, or enter a custom tag
            </p>
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Content</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isGenerating || !titleValue || titleValue.trim().length < 3}
              onClick={generateWithAI}
              className="gap-1.5 text-xs h-7"
            >
              {isGenerating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {isGenerating ? "Generating…" : "Generate with AI"}
            </Button>
          </div>

          <TipTapEditor
            key={editorKey}
            content={content}
            onChange={setContent}
            placeholder="Start writing your blog post… Use the toolbar above for formatting, headings, lists, images, and more."
            minHeight="520px"
          />

          {/* Size meter + Preview */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className={`flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-xs ${sizeWarning ? "text-amber-500" : "text-muted-foreground"}`}>
              {sizeWarning ? <AlertTriangle className="size-3.5 shrink-0" /> : <HardDrive className="size-3.5 shrink-0" />}
              <span className="shrink-0">{contentKb} KB</span>
              {sizeWarning && (
                <span className="wrap-break-word">— Large content (inline images inflate size). Consider linking images by URL instead of uploading.</span>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowPreview(true)}
              className="gap-1.5 text-xs h-7"
            >
              <Eye className="size-3.5" />
              Preview
            </Button>
          </div>
        </div>

        {/* Gems reward hint */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-900/10">
          <Gem className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-foreground">Earn gems when your blog goes live</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Submit for review → pass editorial review → admin awards gems to your profile. Gems reflect your contribution to the community.
            </p>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between border-t border-border pt-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSavingDraft || isSubmitting}
              onClick={saveDraft}
              className="gap-2"
            >
              {isSavingDraft ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Pencil className="size-4" />
              )}
              Save as draft
            </Button>
            {editId && <AutoSaveIndicator status={autoSaveStatus} lastSavedAt={lastSavedAt} />}
          </div>

          <Button
            type="button"
            disabled={isSavingDraft || isSubmitting}
            onClick={submitForReview}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {editId ? "Save & submit" : "Submit for review"}
          </Button>
        </div>
      </div>
    </main>
    </>
  );
}

/* ─── auto-save indicator ────────────────────────────────────────── */
function AutoSaveIndicator({ status, lastSavedAt }: { status: string; lastSavedAt: Date | null }) {
  if (status === "idle") return null;
  if (status === "saving")
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Saving…
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

/* ─── title status indicator ──────────────────────────────────────── */
function TitleStatus({ status }: { status: "idle" | "checking" | "available" | "taken" }) {
  if (status === "idle") return null;
  if (status === "checking")
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Checking…
      </span>
    );
  if (status === "available")
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3" /> Available
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-destructive">
      <XCircle className="size-3" /> Already taken
    </span>
  );
}

/* ─── skeleton ────────────────────────────────────────────────────── */
function EditorSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-11 w-full rounded-md" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-10 rounded-md" />
        <Skeleton className="h-10 rounded-md" />
      </div>
      <Skeleton className="h-[520px] w-full rounded-xl" />
    </div>
  );
}

/* ─── page export (wraps in Suspense for useSearchParams) ─────────── */
export default function NewBlogPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <NewBlogForm />
    </Suspense>
  );
}
