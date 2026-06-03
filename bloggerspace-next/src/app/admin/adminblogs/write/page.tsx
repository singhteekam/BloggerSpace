"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, Save, Globe, X, Cloud, CloudOff,
  Sparkles, Eye, HardDrive, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { useAutoSave } from "@/hooks/use-autosave";
import { adminApi } from "@/lib/api/admin";
import { blogWriteApi } from "@/lib/api/blog-write";
import { TipTapEditor } from "@/components/editor/tiptap-editor";
import { SlugAvailability } from "@/components/blog/title-availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BLOG_CATEGORIES, BLOG_TAGS } from "@/lib/utils/blogCategories";

const ALL_TAGS = BLOG_TAGS;

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function AdminWriteBlogPage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return null;
  if (!user) return null;
  return <WriteBlogEditor adminId={user._id} adminName={user.fullName || user.email || "Admin"} />;
}

function WriteBlogEditor({ adminId, adminName }: { adminId: string; adminName: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const draftIdRef = useRef<string | undefined>(undefined);

  const contentBytes = new Blob([content]).size;
  const contentKb = (contentBytes / 1024).toFixed(1);
  const sizeWarning = contentBytes > 200 * 1024;

  const tagSuggestions = tagInput.trim().length > 0
    ? ALL_TAGS.filter((t) => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t)).slice(0, 8)
    : [];

  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) setTags((p) => [...p, tag]);
    setTagInput("");
  }, [tagInput, tags]);

  const removeTag = (tag: string) => setTags((p) => p.filter((t) => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
    if (e.key === "Backspace" && !tagInput && tags.length) setTags((p) => p.slice(0, -1));
  };

  const generateWithAI = async () => {
    if (!title.trim() || title.trim().length < 3) {
      toast.error("Enter a title (at least 3 characters) before generating.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await blogWriteApi.generateAI(title.trim());
      setContent(res.data.html);
      setEditorKey((k) => k + 1);
      toast.success("AI content generated! Review before publishing.");
    } catch {
      toast.error("AI generation failed. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const effectiveCategory = () => category === "Other" ? otherCategory.trim() : category;

  const payload = () => ({
    title: title.trim(),
    slug: slug || toSlug(title.trim()),
    content,
    category: effectiveCategory(),
    tags,
  });

  const handleSaveDraft = async () => {
    if (!title.trim()) { toast.error("Title is required."); return; }
    setSaving(true);
    try {
      const res = await adminApi.saveAdminBlogAsDraft(adminId, { id: draftIdRef.current, ...payload() });
      draftIdRef.current = res.data._id;
      toast.success("Saved as draft.");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Save failed.") : "Error.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const plain = content.replace(/<[^>]+>/g, "").trim();
    if (!title.trim() || !category || !plain) {
      toast.error("Title, category and content are required.");
      return;
    }
    if (category === "Other" && !otherCategory.trim()) {
      toast.error("Please specify your custom category.");
      return;
    }
    setPublishing(true);
    try {
      if (draftIdRef.current) {
        await adminApi.publishAdminBlogEdit(draftIdRef.current, adminId, payload());
      } else {
        await adminApi.createAdminBlog(adminId, payload());
      }
      toast.success("Blog published!");
      router.push("/admin/manage/adminblogs");
    } catch (err) {
      toast.error(isAxiosError(err) ? (err.response?.data?.message ?? "Publish failed.") : "Error.");
    } finally {
      setPublishing(false);
    }
  };

  const autoSaveFn = useCallback(async () => {
    if (!title.trim()) return;
    const res = await adminApi.saveAdminBlogAsDraft(adminId, { id: draftIdRef.current, ...payload() });
    draftIdRef.current = res.data._id;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId, title, slug, category, otherCategory, tags, content]);

  const { autoSaveStatus } = useAutoSave(autoSaveFn, [title, slug, category, tags, content], {
    canSave: !!title.trim(),
  });

  return (
    <>
      {/* Preview dialog */}
      <Dialog.Root open={showPreview} onOpenChange={setShowPreview}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-8 shadow-xl">
            <Dialog.Title className="font-serif text-2xl font-semibold mb-1">{title || "Preview"}</Dialog.Title>
            <p className="text-xs text-muted-foreground mb-6">By {adminName}</p>
            <div className="blog-prose" dangerouslySetInnerHTML={{ __html: content || "<p class='text-muted-foreground'>No content yet.</p>" }} />
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" className="mt-8">Close preview</Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/admin/manage/adminblogs"><ArrowLeft className="size-4" /></Link>
          </Button>
          <h1 className="font-serif text-xl font-semibold">Write new blog</h1>
          <span className="text-sm text-muted-foreground">
            Author: <span className="font-medium text-foreground">{adminName}</span>
          </span>
          <AutoSaveIndicator status={autoSaveStatus} />
        </div>

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Blog title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setSlug(toSlug(e.target.value.trim())); }}
              autoFocus
            />
            <div className="flex justify-end">
              <SlugAvailability slug={slug} />
            </div>
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" placeholder="auto-generated-from-title" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>

          {/* Category + Tags */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select a category…</option>
                {BLOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
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

            <div className="space-y-1.5">
              <Label htmlFor="tagInput">
                Tags <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 focus-within:ring-1 focus-within:ring-ring">
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
                      id="tagInput"
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
                      <button key={s} type="button"
                        onMouseDown={(e) => { e.preventDefault(); if (!tags.includes(s) && tags.length < 10) setTags((p) => [...p, s]); setTagInput(""); }}
                        className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      >{s}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Content *</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isGenerating || !title.trim() || title.trim().length < 3}
                onClick={generateWithAI}
                className="gap-1.5 text-xs h-7"
              >
                {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                {isGenerating ? "Generating…" : "Generate with AI"}
              </Button>
            </div>
            <TipTapEditor key={editorKey} content={content} onChange={setContent} placeholder="Write your blog…" minHeight="400px" />
            <div className="flex items-center justify-between pt-1">
              <div className={`flex items-center gap-1.5 text-xs ${sizeWarning ? "text-amber-500" : "text-muted-foreground"}`}>
                {sizeWarning ? <AlertTriangle className="size-3.5" /> : <HardDrive className="size-3.5" />}
                {contentKb} KB
                {sizeWarning && <span>— Large content. Link images by URL instead of uploading.</span>}
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowPreview(true)} className="gap-1.5 text-xs h-7">
                <Eye className="size-3.5" />Preview
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
            <Button variant="outline" size="sm" className="gap-1.5" disabled={saving} onClick={handleSaveDraft}>
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}Save as Draft
            </Button>
            <Button size="sm" className="gap-1.5" disabled={publishing} onClick={handlePublish}>
              {publishing ? <Loader2 className="size-3.5 animate-spin" /> : <Globe className="size-3.5" />}Publish
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/manage/adminblogs">Cancel</Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

function AutoSaveIndicator({ status }: { status: string }) {
  if (status === "idle") return null;
  if (status === "saving") return <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" />Saving…</span>;
  if (status === "saved") return <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><Cloud className="size-3" />Saved</span>;
  return <span className="ml-auto flex items-center gap-1 text-xs text-destructive"><CloudOff className="size-3" />Auto-save failed</span>;
}
