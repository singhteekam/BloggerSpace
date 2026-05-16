import { Node, mergeAttributes } from "@tiptap/core";

/**
 * RawHtml — stores any HTML element unknown to TipTap's schema as an opaque block.
 * The raw HTML is URI-encoded in a data attribute so ProseMirror can round-trip it
 * without parsing or mangling the content.
 *
 * Pre-processing (before setContent): unknown top-level elements are wrapped as
 *   <div data-type="raw-html" data-raw-html="...encoded..."></div>
 *
 * Post-processing (after getHTML): those divs are decoded back to original HTML.
 */
export const RawHtml = Node.create({
  name: "rawHtml",
  group: "block",
  atom: true, // treat as indivisible unit — not editable internally

  addAttributes() {
    return {
      html: {
        default: "",
        parseHTML: (el) =>
          decodeURIComponent(el.getAttribute("data-raw-html") ?? ""),
        renderHTML: (attrs) => ({
          "data-raw-html": encodeURIComponent((attrs.html as string) ?? ""),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="raw-html"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-type": "raw-html" }, HTMLAttributes),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.className = "raw-html-block";
      dom.setAttribute("data-type", "raw-html");
      dom.setAttribute("contenteditable", "false");
      dom.innerHTML = (node.attrs.html as string) ?? "";
      return { dom };
    };
  },
});
