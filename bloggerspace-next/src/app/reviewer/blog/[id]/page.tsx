"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, Star, Send, Trash2, CheckCheck,
  Tag, User, Clock, MessageSquare, X, ChevronsUpDown, Check,
  Pencil, Save, HardDrive, Cloud, CloudOff,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { useRequireReviewer } from "@/hooks/use-require-reviewer";
import { useAutoSave } from "@/hooks/use-autosave";
import { reviewerApi, type ReviewerBlogDetail, type FeedbackEntry } from "@/lib/api/reviewer";
import { TipTapEditor } from "@/components/editor/tiptap-editor";
import { TitleAvailability } from "@/components/blog/title-availability";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils/html";
import { BLOG_CATEGORIES, BLOG_TAGS } from "@/lib/utils/blogCategories";

const CATEGORIES = BLOG_CATEGORIES;
const ALL_TAGS = BLOG_TAGS;

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function ReviewBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: blogId } = use(params);
  const { user, isLoading: authLoading } = useRequireReviewer();
  const router = useRouter();

  const [blog, setBlog] = useState<ReviewerBlogDetail | null>(null);
  const [content, setContent] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [loadingBlog, setLoadingBlog] = useState(true);

  // Editable metadata
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");

  // Review fields
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const [savingDraft, setSavingDraft] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  useEffect(() => {
    if (!user) return;
    reviewerApi
      .getBlogForReview(blogId)
      .then((res) => {
        const b = res.data;
        setBlog(b);
        setTitle(b.title ?? "");
        const storedCat = b.category ?? "";
        if (CATEGORIES.includes(storedCat)) {
          setCategory(storedCat);
        } else {
          setCategory("Other");
          setOtherCategory(storedCat);
        }
        setTags(b.tags ?? []);
        setContent(b.content ?? "");
        setEditorKey((k) => k + 1);
      })
      .catch(() => toast.error("Failed to load blog."))
      .finally(() => setLoadingBlog(false));
  }, [blogId, user]);

  // Tag helpers
  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) setTags((p) => [...p, tag]);
    setTagInput("");
  }, [tagInput, tags]);

  const removeTag = (t: string) => setTags((p) => p.filter((x) => x !== t));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
    if (e.key === "Backspace" && !tagInput && tags.length) setTags((p) => p.slice(0, -1));
  };

  const slug = toSlug(title);
  const filteredCategories = catSearch
    ? CATEGORIES.filter((c) => c.toLowerCase().includes(catSearch.toLowerCase()))
    : CATEGORIES;

  const effectiveCategory = category === "Other" ? otherCategory.trim() : category;
  const buildDraftPayload = () => ({ slug, title, content, category: effectiveCategory, tags });

  // Auto-save (every 30 s, no toast, no navigation)
  const { autoSaveStatus, lastSavedAt } = useAutoSave(
    async () => {
      if (!user || !blog) return;
      await reviewerApi.saveDraft(blogId, user._id, user.email, buildDraftPayload());
    },
    { title, category, tags, content },
    { canSave: !!user && !!blog && !!title && !!category },
  );

  const handleSaveDraft = async () => {
    if (!user || !blog) return;
    setSavingDraft(true);
    try {
      await reviewerApi.saveDraft(blogId, user._id, user.email, buildDraftPayload());
      toast.success("Draft saved — you can continue reviewing later.");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.error ?? "Failed to save draft.") : "Error.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!user || !blog) return;
    if (rating === 0) { toast.error("Please select a rating before submitting."); return; }
    if (!remarks.trim()) { toast.error("Please add review remarks before submitting."); return; }
    if (category === "Other" && !otherCategory.trim()) {
      toast.error("Please specify your custom category.");
      return;
    }
    setSavingEdits(true);
    try {
      await reviewerApi.saveEdits(blogId, user._id, user.email, {
        slug, title, content, category: effectiveCategory, rating, reviewRemarks: remarks, tags,
      });
      toast.success("Edits saved — blog sent for admin review.");
      router.push("/reviewer");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed to save.") : "Error.");
    } finally {
      setSavingEdits(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!user || !blog) return;
    if (!feedback.trim()) { toast.error("Please write your feedback before sending."); return; }
    setSendingFeedback(true);
    try {
      await reviewerApi.sendFeedback(user._id, user.email, blogId, feedback);
      toast.success("Feedback sent to author.");
      setFeedbackOpen(false);
      router.push("/reviewer");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed to send.") : "Error.");
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleDiscard = async () => {
    if (!user || !blog) return;
    setDiscarding(true);
    try {
      await reviewerApi.discardBlog(blogId, user._id, user.email, {
        rating, reviewRemarks: remarks || "Discarded by reviewer.",
      });
      toast.success("Blog moved to discard queue.");
      setDiscardOpen(false);
      router.push("/reviewer");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Failed to discard.") : "Error.");
    } finally {
      setDiscarding(false);
    }
  };

  if (authLoading || loadingBlog) return <ReviewSkeleton />;
  if (!user || !blog) return null;

  const tagSuggestions = tagInput.trim()
    ? ALL_TAGS.filter((t) => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t)).slice(0, 8)
    : [];

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/reviewer"><ArrowLeft className="size-4" />Dashboard</Link>
        </Button>
        <Badge variant="secondary" className="text-xs">{blog.status}</Badge>
        <AutoSaveIndicator status={autoSaveStatus} lastSavedAt={lastSavedAt} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ── Left: metadata + editor ─────────────────────────────── */}
        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="rev-title">Title</Label>
            <Input
              id="rev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Blog title…"
              className="text-base font-medium"
            />
            <div className="flex items-center justify-between gap-2">
              {slug ? (
                <p className="text-xs text-muted-foreground truncate">
                  /blogs/<span className="font-medium text-foreground">{slug}</span>
                </p>
              ) : (
                <span />
              )}
              <TitleAvailability title={title} excludeId={blogId} />
            </div>
          </div>

          {/* Category + Tags */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Category */}
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Popover.Root open={catOpen} onOpenChange={setCatOpen}>
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <span className={category ? "text-foreground" : "text-muted-foreground"}>
                      {category || "Select category…"}
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-border bg-popover shadow-md"
                    sideOffset={4}
                  >
                    <div className="border-b border-border p-2">
                      <Input
                        placeholder="Search…"
                        value={catSearch}
                        onChange={(e) => setCatSearch(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1">
                      {filteredCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => { setCategory(cat); setCatOpen(false); setCatSearch(""); }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
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

            {/* Tags */}
            <div className="space-y-1.5">
              <Label>Tags <span className="text-xs font-normal text-muted-foreground">(optional · Enter or comma)</span></Label>
              <div className="relative">
                <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="rounded hover:text-destructive" aria-label={`Remove ${tag}`}>
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
                        onMouseDown={(e) => { e.preventDefault(); setTags((p) => [...p, s]); setTagInput(""); }}
                        className="flex w-full px-3 py-2 text-sm hover:bg-accent"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{tags.length}/10 tags</p>
            </div>
          </div>

          {/* Author meta (read-only) */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {blog.authorDetails && (
              <span className="flex items-center gap-1"><User className="size-3" />{blog.authorDetails.fullName ?? blog.authorDetails.userName}</span>
            )}
            <span className="flex items-center gap-1"><Clock className="size-3" />{formatDate(blog.lastUpdatedAt || blog.createdAt)}</span>
          </div>

          {/* Editor */}
          <div className="space-y-1.5">
            <Label>Content</Label>
            <TipTapEditor key={editorKey} content={content} onChange={setContent} />
          </div>
        </div>

        {/* ── Right: review panel ─────────────────────────────────── */}
        <div className="space-y-5">
          {/* Rating */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Label className="text-sm font-medium">Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${star}`}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={`size-7 transition-colors ${star <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-muted-foreground">{["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}</p>
            )}
          </div>

          {/* Remarks */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Label htmlFor="remarks" className="text-sm font-medium">Review remarks</Label>
            <textarea
              id="remarks"
              rows={5}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Internal review notes (required before submitting)…"
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <p className="text-sm font-medium text-foreground">Actions</p>

            {/* Save draft */}
            <Button variant="outline" className="w-full gap-2" disabled={savingDraft} onClick={handleSaveDraft}>
              {savingDraft ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save as draft
            </Button>

            {/* Submit */}
            <Button className="w-full gap-2" disabled={savingEdits} onClick={handleSaveEdits}>
              {savingEdits ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
              Save edits &amp; submit
            </Button>

            {/* Feedback dialog */}
            <Dialog.Root open={feedbackOpen} onOpenChange={setFeedbackOpen}>
              <Dialog.Trigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <MessageSquare className="size-4" />Send feedback to author
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                  <Dialog.Title className="font-serif text-lg font-semibold">Send feedback to author</Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">The author will receive your feedback by email and can revise accordingly.</Dialog.Description>
                  <textarea
                    rows={5}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Describe what needs to be improved…"
                    className="mt-4 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                    autoFocus
                  />
                  <div className="mt-4 flex justify-end gap-2">
                    <Dialog.Close asChild><Button variant="outline" size="sm">Cancel</Button></Dialog.Close>
                    <Button size="sm" disabled={sendingFeedback} onClick={handleSendFeedback} className="gap-2">
                      {sendingFeedback ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}Send
                    </Button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            {/* Discard dialog */}
            <Dialog.Root open={discardOpen} onOpenChange={setDiscardOpen}>
              <Dialog.Trigger asChild>
                <Button variant="ghost" className="w-full gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="size-4" />Discard blog
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                  <Dialog.Title className="font-serif text-lg font-semibold">Discard this blog?</Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm text-muted-foreground">This will move the blog to the discard queue. This cannot be undone.</Dialog.Description>
                  <div className="mt-5 flex justify-end gap-2">
                    <Dialog.Close asChild><Button variant="outline" size="sm">Cancel</Button></Dialog.Close>
                    <Button variant="destructive" size="sm" disabled={discarding} onClick={handleDiscard} className="gap-2">
                      {discarding ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}Discard
                    </Button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>

          {/* Previous feedback */}
          {blog.feedbackToAuthor?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="text-sm font-medium text-foreground">Previous feedback</p>
              <Separator />
              <div className="space-y-3">
                {blog.feedbackToAuthor.map((entry, i) => (
                  <FeedbackCard key={i} entry={entry} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ─── auto-save status chip ───────────────────────────────────────── */
function AutoSaveIndicator({ status, lastSavedAt }: { status: string; lastSavedAt: Date | null }) {
  if (status === "saving") return (
    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
      <Loader2 className="size-3 animate-spin" />Auto-saving…
    </span>
  );
  if (status === "saved" && lastSavedAt) return (
    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
      <Cloud className="size-3 text-emerald-500" />
      Saved {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
  if (status === "error") return (
    <span className="ml-auto flex items-center gap-1 text-xs text-destructive">
      <CloudOff className="size-3" />Auto-save failed
    </span>
  );
  return null;
}

function FeedbackCard({ entry }: { entry: FeedbackEntry }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground">{entry.ReviewerEmail}</span>
        <span className="text-xs text-muted-foreground">{formatDate(entry.LastUpdated)}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{entry.Feedback}</p>
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Skeleton className="h-10 rounded-md" />
          <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-10 rounded-md" /><Skeleton className="h-10 rounded-md" /></div>
          <Skeleton className="h-[480px] rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
