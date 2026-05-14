"use client";

import type { Editor } from "@tiptap/react";
import { useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Link2,
  Undo2,
  Redo2,
  CodeSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Image as ImageIcon,
  Upload,
  Table as TableIcon,
  RemoveFormatting,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const insertImageByUrl = () => {
    const url = window.prompt("Image URL:", "https://");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const insertImageByFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      editor.chain().focus().setImage({ src: dataUrl }).run();
    };
    reader.readAsDataURL(file);
    // Reset so same file can be selected again
    e.target.value = "";
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-3 py-2">
      {/* Undo / Redo */}
      <ToolbarGroup>
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo2 className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo2 className="size-4" />
        </Btn>
      </ToolbarGroup>

      <Sep />

      {/* Text format */}
      <ToolbarGroup>
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <UnderlineIcon className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough className="size-4" />
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleHighlight({ color: "#fde68a" }).run()}
          active={editor.isActive("highlight")}
          title="Highlight"
        >
          <Highlighter className="size-4" />
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          title="Clear formatting"
        >
          <RemoveFormatting className="size-4" />
        </Btn>
      </ToolbarGroup>

      <Sep />

      {/* Headings */}
      <ToolbarGroup>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
          <Heading1 className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <Heading3 className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive("heading", { level: 4 })} title="Heading 4">
          <Heading4 className="size-4" />
        </Btn>
      </ToolbarGroup>

      <Sep />

      {/* Alignment */}
      <ToolbarGroup>
        <Btn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
          <AlignLeft className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">
          <AlignCenter className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
          <AlignRight className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
          <AlignJustify className="size-4" />
        </Btn>
      </ToolbarGroup>

      <Sep />

      {/* Lists */}
      <ToolbarGroup>
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <List className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list">
          <ListOrdered className="size-4" />
        </Btn>
      </ToolbarGroup>

      <Sep />

      {/* Blocks */}
      <ToolbarGroup>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <Quote className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
          <Code className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
          <CodeSquare className="size-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
          <Minus className="size-4" />
        </Btn>
      </ToolbarGroup>

      <Sep />

      {/* Insert */}
      <ToolbarGroup>
        <Btn onClick={setLink} active={editor.isActive("link")} title="Insert link">
          <Link2 className="size-4" />
        </Btn>
        <Btn onClick={insertImageByUrl} title="Insert image by URL">
          <ImageIcon className="size-4" />
        </Btn>
        {/* Upload image from disk — converts to base64 data URI inline */}
        <label
          className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Upload image from device"
        >
          <Upload className="size-4" />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={insertImageByFile}
          />
        </label>
        <Btn onClick={insertTable} title="Insert table">
          <TableIcon className="size-4" />
        </Btn>
      </ToolbarGroup>

      {/* Text color */}
      <Sep />
      <div className="flex items-center gap-1" title="Text color">
        <label className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" title="Text color">
          <span className="text-xs font-bold underline" style={{ textDecorationColor: "currentcolor" }}>A</span>
          <input
            type="color"
            className="sr-only"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>
      </div>
    </div>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Sep() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-border" />;
}

function Btn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-foreground",
        active && "bg-accent text-foreground",
        disabled && "pointer-events-none opacity-30",
      )}
    >
      {children}
    </button>
  );
}
