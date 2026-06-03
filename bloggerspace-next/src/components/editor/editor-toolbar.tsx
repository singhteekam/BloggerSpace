"use client";

import type { Editor } from "@tiptap/react";
import { useRef, useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, ListChecks, Quote, Code, Minus,
  Link2, Undo2, Redo2, CodeSquare,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter, Image as ImageIcon, Upload, Table as TableIcon,
  RemoveFormatting, FileCode, Code2,
  Search, SubscriptIcon, SuperscriptIcon,
  TableRowsSplit, Columns3, Trash2, Merge, Plus,
  ChevronDown, Music,
  ChevronsDownUp, SmilePlus, Video,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

// ─── Data ─────────────────────────────────────────────────────────────────────

const CODE_LANGUAGES = [
  { value: "plaintext",   label: "Plain text" },
  { value: "javascript",  label: "JavaScript" },
  { value: "typescript",  label: "TypeScript" },
  { value: "jsx",         label: "JSX" },
  { value: "tsx",         label: "TSX" },
  { value: "html",        label: "HTML" },
  { value: "css",         label: "CSS" },
  { value: "python",      label: "Python" },
  { value: "java",        label: "Java" },
  { value: "c",           label: "C" },
  { value: "cpp",         label: "C++" },
  { value: "csharp",      label: "C#" },
  { value: "go",          label: "Go" },
  { value: "rust",        label: "Rust" },
  { value: "php",         label: "PHP" },
  { value: "ruby",        label: "Ruby" },
  { value: "swift",       label: "Swift" },
  { value: "kotlin",      label: "Kotlin" },
  { value: "sql",         label: "SQL" },
  { value: "bash",        label: "Bash / Shell" },
  { value: "json",        label: "JSON" },
  { value: "yaml",        label: "YAML" },
  { value: "markdown",    label: "Markdown" },
  { value: "xml",         label: "XML" },
  { value: "dockerfile",  label: "Dockerfile" },
];

const SPECIAL_CHARS = [
  { group: "Symbols",    chars: ["©", "®", "™", "§", "¶", "†", "‡", "•", "·", "…", "‣", "‰", "№"] },
  { group: "Quotes",     chars: ["“", "”", "‘", "’", "«", "»", "‹", "›", "„", "‟"] },
  { group: "Math",       chars: ["±", "×", "÷", "≠", "≤", "≥", "≈", "∞", "√", "∑", "∫", "π", "°", "′", "″"] },
  { group: "Arrows",     chars: ["→", "←", "↑", "↓", "↔", "↕", "⇒", "⇐", "⟹", "⟺", "↗", "↘", "↙", "↖"] },
  { group: "Greek",      chars: ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "λ", "μ", "ν", "ξ", "π", "σ", "φ", "ψ", "ω"] },
  { group: "Currency",   chars: ["€", "£", "¥", "₹", "₩", "₿", "¢", "₺", "₦"] },
];

const EMOJIS = [
  { group: "Smileys", emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","☺️","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","😎","🤓","🧐"] },
  { group: "People",   emojis: ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","💪","🦾","✍️","💅","🤳","💃","🕺","👶","🧒","👦","👧","🧑","👱","👨","👩","🧓","👴","👵"] },
  { group: "Nature",   emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🌸","🌺","🌻","🌹","🌷","🌱","🌿","🍀","🍃","🍂","🍁","🌾","🌵","🌴","🌳","🌲","🍄","🌊","🌈","☀️","🌙","⭐","❄️","🔥","💧","🌍"] },
  { group: "Food",     emojis: ["🍎","🍊","🍋","🍇","🍓","🫐","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🧄","🧅","🥔","🍠","🥐","🥖","🍞","🥨","🧀","🥚","🍳","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🌮","🌯","🍱","🍜","🍝","🍣","🍤","🦐","🦀","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🍫","🍬","🍭","☕","🍵","🧃","🥤","🧋","🍺","🍻","🥂","🍾"] },
  { group: "Travel",   emojis: ["🚗","🚕","🚙","🚌","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵","🚲","🛴","🚁","✈️","🚀","🛸","⛵","🚢","🗺️","🧭","🏔️","⛰️","🌋","🏕️","🏖️","🏜️","🏝️","🏙️","🌆","🌇","🌉","🗽","🗼","🏰","🏯","⛩️","🕋","⛪","🏠","🏡","🏢","🏥","🏦","🏨","🏪","🏫","🏭","🏬","🏮"] },
  { group: "Objects",  emojis: ["⌚","📱","💻","⌨️","🖥️","🖨️","🖱️","💾","💿","📷","📸","📹","🎥","📞","☎️","📟","📺","📻","🎙️","🧭","⏱️","⏰","🕰️","⌛","⏳","📡","🔋","🔌","💡","🔦","🕯️","💰","💳","💎","⚙️","🔧","🔨","🪛","⛏️","🔩","🧲","🔫","💣","🔪","🛡️","🚪","🛏️","🛁","🧴","🧹","🧺","🧻","🧼","🛒","🧰","📦","📝","✏️","🖊️","📌","📍","✂️","🔏","🔐","🔒","🔓","🔑","🗝️","🔗","💬","💭","🗯️","💤"] },
  { group: "Symbols",  emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","☮️","✝️","☪️","🕉️","☸️","✡️","☯️","☦️","⛎","🆔","☢️","☣️","🚫","✅","❌","⭕","🛑","⛔","📛","💯","💢","♨️","❗","❕","❓","❔","‼️","⁉️","🔅","🔆","🔱","⚜️","🔰","♻️","💱","💲","➕","➖","✖️","➗","♾️","⚠️","🔮","💬","💤"] },
  { group: "Activities", emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🎱","🏓","🏸","🥊","🥅","⛳","🏹","🎣","🤿","🥌","🛷","🛹","⛸️","🎽","🎿","🏋️","🤼","🤸","🤺","🏇","⛷️","🏊","🏄","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖️","🎗️","🎪","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🪕","🎻","🎲","♟️","🎯","🎳","🎮","🎰","🧩"] },
];

// ─── Find helpers ─────────────────────────────────────────────────────────────
function findMatches(editor: Editor, search: string, caseSensitive: boolean) {
  const results: { from: number; to: number }[] = [];
  if (!search.trim()) return results;
  const needle = caseSensitive ? search : search.toLowerCase();
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText) return;
    const text = caseSensitive ? (node.text ?? "") : (node.text ?? "").toLowerCase();
    let start = 0;
    while (true) {
      const idx = text.indexOf(needle, start);
      if (idx === -1) break;
      results.push({ from: pos + idx, to: pos + idx + needle.length });
      start = idx + 1;
    }
  });
  return results;
}

function replaceAll(editor: Editor, search: string, replacement: string, caseSensitive: boolean) {
  const matches = findMatches(editor, search, caseSensitive);
  if (!matches.length) return 0;
  let tr = editor.state.tr;
  for (let i = matches.length - 1; i >= 0; i--) {
    const { from, to } = matches[i];
    if (replacement) tr = tr.replaceWith(from, to, editor.state.schema.text(replacement));
    else tr = tr.delete(from, to);
  }
  editor.view.dispatch(tr);
  return matches.length;
}

function replaceNext(editor: Editor, search: string, replacement: string, caseSensitive: boolean) {
  const matches = findMatches(editor, search, caseSensitive);
  if (!matches.length) return;
  const cursor = editor.state.selection.from;
  const match = matches.find((m) => m.from >= cursor) ?? matches[0];
  let tr = editor.state.tr;
  if (replacement) tr = tr.replaceWith(match.from, match.to, editor.state.schema.text(replacement));
  else tr = tr.delete(match.from, match.to);
  editor.view.dispatch(tr);
  editor.commands.setTextSelection(match.from + replacement.length);
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ToolbarProps {
  editor: Editor | null;
  sourceMode: boolean;
  onToggleSource: () => void;
}

// ─── EditorToolbar ────────────────────────────────────────────────────────────
export function EditorToolbar({ editor, sourceMode, onToggleSource }: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [htmlDialogOpen, setHtmlDialogOpen] = useState(false);
  const [rawHtml, setRawHtml] = useState("");
  const [findOpen, setFindOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Dropdown open states
  const [styleOpen, setStyleOpen] = useState(false);
  const [alignOpen, setAlignOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [insertOpen, setInsertOpen] = useState(false);
  const [specialOpen, setSpecialOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState("");

  // Trigger refs (used by DropPortal to measure position)
  const styleRef = useRef<HTMLDivElement>(null);
  const alignRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const insertRef = useRef<HTMLDivElement>(null);
  const specialRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const closeAll = useCallback(() => {
    setStyleOpen(false); setAlignOpen(false); setListOpen(false);
    setBlockOpen(false); setInsertOpen(false); setSpecialOpen(false); setEmojiOpen(false);
  }, []);

  // Close on outside click — portals are identified by data-toolbar-portal attribute
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest?.("[data-toolbar-portal]")) return;
      if (
        !styleRef.current?.contains(target) &&
        !alignRef.current?.contains(target) &&
        !listRef.current?.contains(target) &&
        !blockRef.current?.contains(target) &&
        !insertRef.current?.contains(target) &&
        !specialRef.current?.contains(target) &&
        !emojiRef.current?.contains(target)
      ) {
        closeAll();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closeAll]);

  useEffect(() => {
    if (!editor || !findText) { setMatchCount(0); return; }
    setMatchCount(findMatches(editor, findText, caseSensitive).length);
  }, [editor, findText, caseSensitive]);

  if (!editor) return null;

  // ── Helpers ───────────────────────────────────────────────────────────────────
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

  const insertImageByFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      setUploading(true);
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      if (res.ok) {
        const { url } = await res.json();
        editor.chain().focus().setImage({ src: url }).run();
        return;
      }
    } catch { /* fall through to base64 */ }
    finally { setUploading(false); }
    const reader = new FileReader();
    reader.onload = () => editor.chain().focus().setImage({ src: reader.result as string }).run();
    reader.readAsDataURL(file);
  };

  const insertYoutube = () => {
    const url = window.prompt("YouTube URL:");
    if (!url) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor.chain().focus() as any).setYoutubeVideo({ src: url }).run();
    closeAll();
  };

  const insertAudio = () => {
    const url = window.prompt("Audio URL (mp3/ogg/wav):");
    if (!url) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor.chain().focus() as any).insertAudio({ src: url }).run();
    closeAll();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const insertDetails = () => {
    // @ts-expect-error — insertDetails is from our custom extension not in typedefs
    editor.chain().focus().insertDetails().run();
    closeAll();
  };

  const headingLabel = () => {
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive("heading", { level: i })) return `H${i}`;
    }
    return "Normal";
  };

  const alignIcon = () => {
    if (editor.isActive({ textAlign: "center" })) return <AlignCenter className="size-4" />;
    if (editor.isActive({ textAlign: "right" })) return <AlignRight className="size-4" />;
    if (editor.isActive({ textAlign: "justify" })) return <AlignJustify className="size-4" />;
    return <AlignLeft className="size-4" />;
  };

  const listIcon = () => {
    if (editor.isActive("orderedList")) return <ListOrdered className="size-4" />;
    if (editor.isActive("taskList")) return <ListChecks className="size-4" />;
    return <List className="size-4" />;
  };

  const isInTable = editor.isActive("table");
  const isInCodeBlock = editor.isActive("codeBlock");
  const currentLang = editor.getAttributes("codeBlock").language ?? "plaintext";
  const filteredEmojis = emojiSearch
    ? EMOJIS.map(g => ({ ...g, emojis: g.emojis.filter(e => e.includes(emojiSearch)) })).filter(g => g.emojis.length)
    : EMOJIS;

  return (
    <div className="overflow-hidden border-b border-border bg-muted/30">

      <div className="flex items-start">
      <div className={cn("flex flex-1 flex-wrap items-center gap-0.5 px-2 py-1.5", sourceMode && "pointer-events-none opacity-40")}>

        {/* History */}
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo2 className="size-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo2 className="size-4" /></Btn>

        <Sep />

        {/* ── Style dropdown ──────────────────────────────────────────────────── */}
        <div className="relative shrink-0" ref={styleRef}>
          <DropBtn onClick={() => { closeAll(); setStyleOpen(v => !v); }} active={styleOpen} title="Text style">
            <span className="min-w-14 text-left text-xs font-semibold">{headingLabel()}</span>
            <ChevronDown className="size-3 shrink-0" />
          </DropBtn>
          <DropPortal open={styleOpen} triggerRef={styleRef}>
            <DropItem onClick={() => { editor.chain().focus().setParagraph().run(); closeAll(); }} active={editor.isActive("paragraph")}>
              <span className="text-sm">Normal text</span>
            </DropItem>
            <div className="my-1 border-t border-border/50" />
            {([1,2,3,4,5,6] as const).map((lvl) => {
              const sizes = ["2em","1.5em","1.25em","1.1em","1em","0.9em"] as const;
              return (
                <DropItem key={lvl} onClick={() => { editor.chain().focus().toggleHeading({ level: lvl }).run(); closeAll(); }} active={editor.isActive("heading", { level: lvl })}>
                  <span style={{ fontSize: sizes[lvl - 1], fontWeight: 600, lineHeight: 1.2 }}>Heading {lvl}</span>
                </DropItem>
              );
            })}
          </DropPortal>
        </div>

        <Sep />

        {/* Text formatting */}
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="size-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="size-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><UnderlineIcon className="size-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><Strikethrough className="size-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript"><SubscriptIcon className="size-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript"><SuperscriptIcon className="size-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHighlight({ color: "#fde68a" }).run()} active={editor.isActive("highlight")} title="Highlight"><Highlighter className="size-4" /></Btn>

        {/* Text color */}
        <label className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" title="Text color">
          <span className="text-xs font-bold underline" style={{ textDecorationColor: "currentcolor" }}>A</span>
          <input type="color" className="sr-only" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
        </label>

        <Btn onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Clear formatting"><RemoveFormatting className="size-4" /></Btn>

        <Sep />

        {/* ── Alignment dropdown */}
        <div className="relative shrink-0" ref={alignRef}>
          <DropBtn onClick={() => { closeAll(); setAlignOpen(v => !v); }} active={alignOpen || editor.isActive({ textAlign: "center" }) || editor.isActive({ textAlign: "right" }) || editor.isActive({ textAlign: "justify" })} title="Text alignment">
            {alignIcon()}
            <ChevronDown className="size-3" />
          </DropBtn>
          <DropPortal open={alignOpen} triggerRef={alignRef}>
            <DropItem onClick={() => { editor.chain().focus().setTextAlign("left").run(); closeAll(); }} active={editor.isActive({ textAlign: "left" })}><AlignLeft className="size-4" /> Align left</DropItem>
            <DropItem onClick={() => { editor.chain().focus().setTextAlign("center").run(); closeAll(); }} active={editor.isActive({ textAlign: "center" })}><AlignCenter className="size-4" /> Align center</DropItem>
            <DropItem onClick={() => { editor.chain().focus().setTextAlign("right").run(); closeAll(); }} active={editor.isActive({ textAlign: "right" })}><AlignRight className="size-4" /> Align right</DropItem>
            <DropItem onClick={() => { editor.chain().focus().setTextAlign("justify").run(); closeAll(); }} active={editor.isActive({ textAlign: "justify" })}><AlignJustify className="size-4" /> Justify</DropItem>
          </DropPortal>
        </div>

        <Sep />

        {/* ── Lists dropdown */}
        <div className="relative shrink-0" ref={listRef}>
          <DropBtn onClick={() => { closeAll(); setListOpen(v => !v); }} active={listOpen || editor.isActive("bulletList") || editor.isActive("orderedList") || editor.isActive("taskList")} title="Lists">
            {listIcon()}
            <ChevronDown className="size-3" />
          </DropBtn>
          <DropPortal open={listOpen} triggerRef={listRef}>
            <DropItem onClick={() => { editor.chain().focus().toggleBulletList().run(); closeAll(); }} active={editor.isActive("bulletList")}><List className="size-4" /> Bullet list</DropItem>
            <DropItem onClick={() => { editor.chain().focus().toggleOrderedList().run(); closeAll(); }} active={editor.isActive("orderedList")}><ListOrdered className="size-4" /> Ordered list</DropItem>
            <DropItem onClick={() => { editor.chain().focus().toggleTaskList().run(); closeAll(); }} active={editor.isActive("taskList")}><ListChecks className="size-4" /> Task list</DropItem>
          </DropPortal>
        </div>

        <Sep />

        {/* ── Blocks dropdown ─────────────────────────────────────────────────── */}
        <div className="relative shrink-0" ref={blockRef}>
          <DropBtn onClick={() => { closeAll(); setBlockOpen(v => !v); }} active={blockOpen} title="Block elements">
            <CodeSquare className="size-4" />
            <ChevronDown className="size-3" />
          </DropBtn>
          <DropPortal open={blockOpen} triggerRef={blockRef}>
            <DropItem onClick={() => { editor.chain().focus().toggleBlockquote().run(); closeAll(); }} active={editor.isActive("blockquote")}><Quote className="size-4" /> Blockquote</DropItem>
            <DropItem onClick={() => { editor.chain().focus().toggleCode().run(); closeAll(); }} active={editor.isActive("code")}><Code className="size-4" /> Inline code</DropItem>
            <DropItem onClick={() => { editor.chain().focus().toggleCodeBlock().run(); closeAll(); }} active={editor.isActive("codeBlock")}><CodeSquare className="size-4" /> Code block</DropItem>
            <DropItem onClick={insertDetails} active={editor.isActive("details")}><ChevronsDownUp className="size-4" /> Details / accordion</DropItem>
            <DropItem onClick={() => { editor.chain().focus().setHorizontalRule().run(); closeAll(); }}><Minus className="size-4" /> Horizontal rule</DropItem>
          </DropPortal>
        </div>

        <Sep />

        {/* Direct insert: Link, Image by URL, Upload, Table */}
        <Btn onClick={setLink} active={editor.isActive("link")} title="Insert / edit link"><Link2 className="size-4" /></Btn>
        <Btn onClick={insertImageByUrl} title="Insert image by URL"><ImageIcon className="size-4" /></Btn>
        <label
          className={cn(
            "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            uploading && "pointer-events-none opacity-50",
          )}
          title={uploading ? "Uploading…" : "Upload image from device"}
        >
          <Upload className="size-4" />
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={insertImageByFile} />
        </label>
        <Btn onClick={insertTable} title="Insert table"><TableIcon className="size-4" /></Btn>

        {/* ── Media / More dropdown ────────────────────────────────────────────── */}
        <div className="relative shrink-0" ref={insertRef}>
          <DropBtn onClick={() => { closeAll(); setInsertOpen(v => !v); }} active={insertOpen} title="Insert media & more">
            <Plus className="size-4" />
            <ChevronDown className="size-3" />
          </DropBtn>
          <DropPortal open={insertOpen} triggerRef={insertRef}>
            <DropItem onClick={insertYoutube}><Video className="size-4" /> YouTube video</DropItem>
            <DropItem onClick={insertAudio}><Music className="size-4" /> Audio</DropItem>
            <DropItem onClick={() => { setRawHtml(""); setHtmlDialogOpen(true); closeAll(); }}><FileCode className="size-4" /> Insert HTML</DropItem>
          </DropPortal>
        </div>

        <Sep />

        {/* Special characters */}
        <div className="relative shrink-0" ref={specialRef}>
          <Btn onClick={() => { closeAll(); setSpecialOpen(v => !v); }} active={specialOpen} title="Special characters">
            <span className="text-xs font-bold">Ω</span>
          </Btn>
          <DropPortal open={specialOpen} triggerRef={specialRef} className="w-72 p-3">
            {SPECIAL_CHARS.map(({ group, chars }) => (
              <div key={group} className="mb-2 last:mb-0">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
                <div className="flex flex-wrap gap-0.5">
                  {chars.map((ch) => (
                    <button key={ch} type="button"
                      onClick={() => { editor.chain().focus().insertContent(ch).run(); setSpecialOpen(false); }}
                      className="flex size-7 items-center justify-center rounded text-sm hover:bg-accent hover:text-foreground transition-colors"
                      title={`U+${ch.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0")}`}
                    >{ch}</button>
                  ))}
                </div>
              </div>
            ))}
          </DropPortal>
        </div>

        {/* Emoji picker */}
        <div className="relative shrink-0" ref={emojiRef}>
          <Btn onClick={() => { closeAll(); setEmojiOpen(v => !v); }} active={emojiOpen} title="Emoji">
            <SmilePlus className="size-4" />
          </Btn>
          <DropPortal open={emojiOpen} triggerRef={emojiRef} className="w-80 p-0 py-0">
            <div className="border-b border-border px-3 py-2">
              <input
                value={emojiSearch}
                onChange={e => setEmojiSearch(e.target.value)}
                placeholder="Search emoji…"
                className="w-full rounded-md bg-muted px-2 py-1 text-xs outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-3">
              {filteredEmojis.map(({ group, emojis }) => (
                <div key={group} className="mb-3 last:mb-0">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
                  <div className="flex flex-wrap gap-0.5">
                    {emojis.map((em, i) => (
                      <button key={i} type="button"
                        onClick={() => { editor.chain().focus().insertContent(em).run(); setEmojiOpen(false); setEmojiSearch(""); }}
                        className="flex size-8 items-center justify-center rounded text-lg hover:bg-accent transition-colors"
                        title={em}
                      >{em}</button>
                    ))}
                  </div>
                </div>
              ))}
              {filteredEmojis.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">No emojis found</p>
              )}
            </div>
          </DropPortal>
        </div>

        <Sep />

        {/* Find & Replace */}
        <Btn onClick={() => { closeAll(); setFindOpen(v => !v); }} active={findOpen} title="Find & Replace"><Search className="size-4" /></Btn>
      </div>

      {/* Source toggle — outside disabled wrapper, always clickable */}
      <div className="flex shrink-0 items-center py-1.5 pr-2">
        <Btn onClick={onToggleSource} active={sourceMode} title={sourceMode ? "Switch to visual editor" : "Edit source HTML"}><Code2 className="size-4" /></Btn>
      </div>
    </div>

      {/* ── Code block language selector ──────────────────────────────────────── */}
      {isInCodeBlock && (
        <div className="flex items-center gap-2 border-t border-border/50 bg-muted/20 px-3 py-1.5">
          <span className="text-xs text-muted-foreground">Language:</span>
          <select
            value={currentLang}
            onChange={(e) => editor.commands.updateAttributes("codeBlock", { language: e.target.value })}
            className="rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
          >
            {CODE_LANGUAGES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Table context toolbar ─────────────────────────────────────────────── */}
      {isInTable && (
        <div className="flex flex-wrap items-center gap-0.5 border-t border-border/50 bg-muted/20 px-3 py-1.5">
          <span className="text-xs text-muted-foreground mr-1">Table:</span>
          <CtxBtn onClick={() => editor.chain().focus().addRowBefore().run()} title="Add row above"><TableRowsSplit className="size-3.5 rotate-180" /><span>Row ↑</span></CtxBtn>
          <CtxBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row below"><TableRowsSplit className="size-3.5" /><span>Row ↓</span></CtxBtn>
          <CtxBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row" danger><Trash2 className="size-3.5" /><span>Del Row</span></CtxBtn>
          <div className="mx-1 h-4 w-px bg-border" />
          <CtxBtn onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add column left"><Columns3 className="size-3.5 rotate-180" /><span>Col ←</span></CtxBtn>
          <CtxBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column right"><Columns3 className="size-3.5" /><span>Col →</span></CtxBtn>
          <CtxBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column" danger><Trash2 className="size-3.5" /><span>Del Col</span></CtxBtn>
          <div className="mx-1 h-4 w-px bg-border" />
          <CtxBtn onClick={() => editor.chain().focus().mergeCells().run()} title="Merge cells"><Merge className="size-3.5" /><span>Merge</span></CtxBtn>
          <CtxBtn onClick={() => editor.chain().focus().splitCell().run()} title="Split cell"><Plus className="size-3.5" /><span>Split</span></CtxBtn>
          <div className="mx-1 h-4 w-px bg-border" />
          <CtxBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table" danger><Trash2 className="size-3.5" /><span>Delete Table</span></CtxBtn>
        </div>
      )}

      {/* ── Find & Replace panel ──────────────────────────────────────────────── */}
      {findOpen && (
        <div className="border-t border-border/50 bg-muted/20 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1">
              <Search className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                placeholder="Find…" value={findText}
                onChange={(e) => setFindText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && editor) {
                    editor.commands.focus();
                    const matches = findMatches(editor, findText, caseSensitive);
                    setMatchCount(matches.length);
                    if (matches[0]) editor.commands.setTextSelection(matches[0]);
                  }
                }}
                className="w-36 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              {findText && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{matchCount} match{matchCount !== 1 ? "es" : ""}</span>}
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1">
              <input placeholder="Replace…" value={replaceText} onChange={(e) => setReplaceText(e.target.value)} className="w-36 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground" />
            </div>
            <label className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground select-none">
              <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} className="rounded" /> Aa
            </label>
            <button type="button" onClick={() => editor && replaceNext(editor, findText, replaceText, caseSensitive)} disabled={!findText} className="rounded-md bg-muted px-3 py-1 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-40 transition-colors">Replace</button>
            <button type="button"
              onClick={() => {
                if (!editor) return;
                const n = replaceAll(editor, findText, replaceText, caseSensitive);
                toast.success(`Replaced ${n} occurrence${n !== 1 ? "s" : ""}.`);
                setMatchCount(0); setFindText("");
              }}
              disabled={!findText}
              className="rounded-md bg-muted px-3 py-1 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-40 transition-colors"
            >Replace All</button>
            <button type="button" onClick={() => { setFindOpen(false); setFindText(""); setReplaceText(""); }} className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors">✕ Close</button>
          </div>
        </div>
      )}

      {/* ── HTML insert dialog ────────────────────────────────────────────────── */}
      {htmlDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl mx-4">
            <p className="font-serif text-lg font-semibold mb-1">Insert HTML</p>
            <p className="text-xs text-muted-foreground mb-3">Paste raw HTML to insert at the cursor position.</p>
            <textarea value={rawHtml} onChange={(e) => setRawHtml(e.target.value)} rows={8} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring resize-y" placeholder="<p>Your HTML here…</p>" autoFocus />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setHtmlDialogOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">Cancel</button>
              <button type="button"
                onClick={() => {
                  if (rawHtml.trim()) editor.chain().focus().insertContent(rawHtml, { parseOptions: { preserveWhitespace: false } }).run();
                  setHtmlDialogOpen(false);
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
              >Insert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DropPortal — renders dropdown to document.body via portal ────────────────
// This prevents any parent overflow:hidden/auto from clipping the menu.
function DropPortal({
  open,
  triggerRef,
  children,
  className,
}: {
  open: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Hidden until measured/positioned so it never flashes at the wrong spot.
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    visibility: "hidden",
  });

  useEffect(() => {
    if (!open || !triggerRef.current || !ref.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dropW = ref.current.offsetWidth;

    // Right-align the menu to the trigger by default; fall back to left-align;
    // then clamp fully inside the viewport so it can't be cut off on small screens.
    let left = rect.right - dropW;
    if (left < margin) left = rect.left;
    left = Math.max(margin, Math.min(left, vw - dropW - margin));

    const top = rect.bottom + 4;
    setStyle({
      position: "fixed",
      top,
      left,
      // Never exceed the viewport — width wraps, height scrolls if needed.
      maxWidth: vw - margin * 2,
      maxHeight: vh - top - margin,
      overflowY: "auto",
      zIndex: 9999,
      visibility: "visible",
    });
  }, [open, triggerRef]);

  if (!open || typeof document === "undefined") return null;

  return ReactDOM.createPortal(
    <div
      ref={ref}
      data-toolbar-portal=""
      style={style}
      className={cn("w-max min-w-40 rounded-xl border border-border bg-card py-1 shadow-xl", className)}
    >
      {children}
    </div>,
    document.body
  );
}

// ─── Small components ─────────────────────────────────────────────────────────
function Sep() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-border" />;
}

function Btn({ onClick, active, disabled, title, children }: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} aria-label={title}
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", active && "bg-accent text-foreground", disabled && "pointer-events-none opacity-30")}
    >{children}</button>
  );
}

function DropBtn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} title={title} aria-label={title}
      className={cn("flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", active && "bg-accent text-foreground")}
    >{children}</button>
  );
}

function DropItem({ onClick, active, children }: {
  onClick: () => void; active?: boolean; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick}
      className={cn("flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground whitespace-nowrap", active && "bg-accent/50 text-foreground font-medium")}
    >{children}</button>
  );
}

function CtxBtn({ onClick, title, children, danger }: {
  onClick: () => void; title: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors", danger ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
    >{children}</button>
  );
}
