"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { posToDOMRect } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Youtube from "@tiptap/extension-youtube";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import Focus from "@tiptap/extension-focus";
import { createLowlight, common } from "lowlight";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Bold, Italic, Underline as UnderlineIcon, Code, Link2, RemoveFormatting } from "lucide-react";
import { EditorToolbar } from "./editor-toolbar";
import { Details, DetailsSummary, DetailsContent } from "./extensions/details-extension";
import { Audio } from "./extensions/audio-extension";
import { RawHtml } from "./extensions/raw-html-extension";
import { cn } from "@/lib/utils/cn";

const lowlight = createLowlight(common);

// ─── Extract <style> / <script> blocks from HTML ─────────────────────────────
// TipTap's ProseMirror schema strips unknown tags like <style> and <script>.
// We pull them out before passing HTML to the editor, keep them in a ref, and
// re-attach them to the onChange output so nothing is ever lost.
const SPECIAL_TAG_RE = /<(style|script)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;

function extractSpecialTags(html: string): { tags: string; body: string } {
  const matches = html.match(SPECIAL_TAG_RE) ?? [];
  const body = html.replace(SPECIAL_TAG_RE, "").trim();
  return { tags: matches.join("\n"), body };
}

// ─── HTML prettifier ──────────────────────────────────────────────────────────
function formatHtml(html: string): string {
  let depth = 0;
  const indent = (n: number) => "  ".repeat(n);
  const INLINE_TAGS = new Set([
    "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn",
    "em", "i", "kbd", "mark", "q", "s", "samp", "small", "span", "strong",
    "sub", "sup", "time", "u", "var", "wbr",
  ]);
  const VOID_TAGS = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
  ]);

  // Tokenise: split into tags and text
  const tokens = html.match(/(<[^>]+>|[^<]+)/g) ?? [];
  const lines: string[] = [];

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    if (!trimmed.startsWith("<")) {
      // Text node
      lines.push(indent(depth) + trimmed);
      continue;
    }

    const isClosing = trimmed.startsWith("</");
    const isSelfClosing = trimmed.endsWith("/>") || VOID_TAGS.has(
      (trimmed.match(/^<(\w+)/)?.[1] ?? "").toLowerCase()
    );
    const tagName = (trimmed.match(/^<\/?(\w+)/)?.[1] ?? "").toLowerCase();
    const isInline = INLINE_TAGS.has(tagName);

    if (isInline) {
      lines.push(indent(depth) + trimmed);
      continue;
    }

    if (isClosing) {
      depth = Math.max(0, depth - 1);
      lines.push(indent(depth) + trimmed);
    } else if (isSelfClosing) {
      lines.push(indent(depth) + trimmed);
    } else {
      lines.push(indent(depth) + trimmed);
      depth++;
    }
  }

  return lines.join("\n");
}

// ─── HTML5 element preservation ──────────────────────────────────────────────
// ProseMirror only knows elements registered in its schema. Any unknown top-level
// block (div, section, article, main, nav, header, footer, aside, form, figure,
// video, canvas, svg, custom elements, …) is silently stripped.
// We solve this by wrapping unknown top-level elements in a sentinel div that
// the RawHtml extension stores as an opaque atom, then unwrapping on output.

const KNOWN_BLOCK_TAGS = new Set([
  "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "pre", "hr",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "details", "summary", "audio", "img", "figure", "figcaption", "iframe",
]);

function preprocessHtmlForEditor(html: string): string {
  if (typeof document === "undefined") return html;
  const template = document.createElement("template");
  template.innerHTML = html;
  const nodes = Array.from(template.content.childNodes);
  const out: string[] = [];
  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node as Text).data.trim();
      if (text) out.push(`<p>${text}</p>`);
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (KNOWN_BLOCK_TAGS.has(tag)) {
      out.push(el.outerHTML);
    } else {
      // Wrap unknown element so RawHtml node can store it
      const encoded = encodeURIComponent(el.outerHTML);
      out.push(`<div data-type="raw-html" data-raw-html="${encoded}"></div>`);
    }
  }
  return out.join("\n") || html;
}

function postprocessHtmlFromEditor(html: string): string {
  if (typeof document === "undefined") return html;
  const template = document.createElement("template");
  template.innerHTML = html;
  const nodes = Array.from(template.content.childNodes);
  const out: string[] = [];
  for (const node of nodes) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      const text = (node as Text).data?.trim();
      if (text) out.push(text);
      continue;
    }
    const el = node as Element;
    if (
      el.tagName.toLowerCase() === "div" &&
      el.getAttribute("data-type") === "raw-html"
    ) {
      const encoded = el.getAttribute("data-raw-html") ?? "";
      out.push(decodeURIComponent(encoded));
    } else {
      out.push(el.outerHTML);
    }
  }
  return out.join("\n") || html;
}

interface TipTapEditorProps {
  content?: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
  minHeight?: string;
}

export function TipTapEditor({
  content = "",
  onChange,
  className,
  placeholder = "Start writing…",
  minHeight = "420px",
}: TipTapEditorProps) {
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceDraft, setSourceDraft] = useState("");
  const sourceDraftRef = useRef(sourceDraft);
  sourceDraftRef.current = sourceDraft;

  // Stores <style>/<script> blocks extracted from content — ProseMirror strips them.
  const extraTagsRef = useRef("");
  // Tracks the last value emitted via onChange so the content sync effect can skip
  // updates that originated from the editor itself (avoids cursor-jump on every keystroke).
  const lastEmittedRef = useRef("");

  // On mount, extract any <style>/<script> from the initial content prop.
  const initialBody = useMemo(() => {
    const { tags, body } = extractSpecialTags(content);
    extraTagsRef.current = tags;
    return preprocessHtmlForEditor(body);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: false,
        // Disable StarterKit's bundled copies — configured explicitly below
        link: false,
        underline: false,
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline underline-offset-4" },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Subscript,
      Superscript,
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "plaintext",
        HTMLAttributes: { class: "code-block-lowlight" },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Youtube.configure({ nocookie: true, HTMLAttributes: { class: "youtube-embed" } }),
      CharacterCount,
      Typography,
      Focus.configure({ className: "has-focus", mode: "shallowest" }),
      Details,
      DetailsSummary,
      DetailsContent,
      Audio,
      RawHtml,
    ],
    content: initialBody,
    editorProps: {
      attributes: {
        class: `blog-prose focus:outline-none px-8 py-6`,
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      const tags = extraTagsRef.current;
      const output = (tags ? tags + "\n" : "") + postprocessHtmlFromEditor(editor.getHTML());
      lastEmittedRef.current = output;
      onChange(output);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor || !content) return;
    // Skip if this content update came from the editor itself — prevents cursor jump
    if (content === lastEmittedRef.current) return;
    const { tags, body } = extractSpecialTags(content);
    extraTagsRef.current = tags;
    const processed = preprocessHtmlForEditor(body);
    editor.commands.setContent(processed || "<p></p>", { emitUpdate: false });
  }, [content, editor]);

  const toggleSource = useCallback(() => {
    if (!editor) return;
    if (!sourceMode) {
      // Entering source mode: decode raw-html nodes and show full HTML
      const tags = extraTagsRef.current;
      const fullHtml = (tags ? tags + "\n" : "") + postprocessHtmlFromEditor(editor.getHTML());
      setSourceDraft(formatHtml(fullHtml));
      setSourceMode(true);
    } else {
      // Leaving source mode: extract <style>/<script>, preprocess, feed to editor
      const { tags, body } = extractSpecialTags(sourceDraftRef.current);
      extraTagsRef.current = tags;
      const processed = preprocessHtmlForEditor(body);
      editor.commands.setContent(processed || "<p></p>", { emitUpdate: false });
      onChange((tags ? tags + "\n" : "") + postprocessHtmlFromEditor(editor.getHTML()));
      setSourceMode(false);
    }
  }, [editor, sourceMode, onChange]);

  // ── Bubble menu position ──────────────────────────────────────────────────
  const [bubblePos, setBubblePos] = useState<{ top: number; left: number } | null>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;
    const update = () => {
      const { state, view } = editor;
      const { selection } = state;
      if (selection.empty || sourceMode) { setBubblePos(null); return; }
      const rect = posToDOMRect(view, selection.from, selection.to);
      const wrapRect = editorWrapRef.current?.getBoundingClientRect();
      if (!wrapRect) return;
      setBubblePos({
        top: rect.top - wrapRect.top - 44,
        left: Math.max(0, (rect.left + rect.right) / 2 - wrapRect.left - 120),
      });
    };
    editor.on("selectionUpdate", update);
    editor.on("blur", () => setBubblePos(null));
    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor, sourceMode]);

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;

  return (
    // overflow-hidden is intentionally NOT on the outer div — it would clip the bubble menu.
    // w-full + min-w-0 constrain the wrapper to its parent track so toolbar overflow-x-auto
    // actually creates a scroll container rather than letting the whole editor expand.
    <div ref={editorWrapRef} className={cn("relative w-full min-w-0 rounded-xl border border-border bg-card", className)}>
      <EditorToolbar
        editor={editor}
        sourceMode={sourceMode}
        onToggleSource={toggleSource}
      />

      {/* ── Floating bubble toolbar ───────────────────────────────────────────── */}
      {editor && bubblePos && !sourceMode && (
        <div
          style={{ top: bubblePos.top, left: bubblePos.left }}
          className="pointer-events-auto absolute z-40 flex items-center gap-0.5 rounded-lg border border-border bg-card px-1 py-1 shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          <BubbleBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="size-3.5" /></BubbleBtn>
          <BubbleBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="size-3.5" /></BubbleBtn>
          <BubbleBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><UnderlineIcon className="size-3.5" /></BubbleBtn>
          <BubbleBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code"><Code className="size-3.5" /></BubbleBtn>
          <div className="mx-0.5 h-4 w-px bg-border" />
          <BubbleBtn
            onClick={() => {
              const prev = editor.getAttributes("link").href as string | undefined;
              const url = window.prompt("URL", prev ?? "https://");
              if (url === null) return;
              if (url === "") { editor.chain().focus().unsetLink().run(); return; }
              editor.chain().focus().setLink({ href: url }).run();
            }}
            active={editor.isActive("link")}
            title="Link"
          ><Link2 className="size-3.5" /></BubbleBtn>
          <BubbleBtn onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Clear format"><RemoveFormatting className="size-3.5" /></BubbleBtn>
        </div>
      )}

      {/* Content area — overflow-hidden here only so images/code don't bleed past rounded-b-xl */}
      <div className="overflow-hidden rounded-b-xl">
        {sourceMode ? (
          <textarea
            value={sourceDraft}
            onChange={(e) => setSourceDraft(e.target.value)}
            className="w-full resize-none bg-background px-4 py-4 font-mono text-xs text-foreground outline-none"
            style={{ minHeight }}
            spellCheck={false}
          />
        ) : (
          <EditorContent editor={editor} />
        )}

        {/* ── Word / character count footer ──────────────────────────────────── */}
        {!sourceMode && (
          <div className="flex items-center justify-end gap-3 border-t border-border/50 bg-muted/20 px-4 py-1.5">
            <span className="text-[11px] text-muted-foreground">{wordCount} word{wordCount !== 1 ? "s" : ""}</span>
            <span className="text-[11px] text-muted-foreground">{charCount} char{charCount !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bubble menu button ───────────────────────────────────────────────────────
function BubbleBtn({
  onClick, active, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        active && "bg-accent text-foreground",
      )}
    >
      {children}
    </button>
  );
}
