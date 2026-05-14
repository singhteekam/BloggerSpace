"use client";

import { useEditor, EditorContent } from "@tiptap/react";
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
import { useEffect } from "react";
import { EditorToolbar } from "./editor-toolbar";
import { cn } from "@/lib/utils/cn";

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
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
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
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editorProps: {
      attributes: {
        class: `blog-prose focus:outline-none px-8 py-6`,
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor || !content) return;
    if (editor.getHTML() === content) return;
    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
