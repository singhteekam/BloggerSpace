import { Node, mergeAttributes } from "@tiptap/core";

export const DetailsContent = Node.create({
  name: "detailsContent",
  content: "block+",
  defining: true,
  parseHTML() { return [{ tag: "div[data-details-content]" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-details-content": "" }), 0];
  },
});

export const DetailsSummary = Node.create({
  name: "detailsSummary",
  content: "inline*",
  defining: true,
  parseHTML() { return [{ tag: "summary" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["summary", HTMLAttributes, 0];
  },
});

export const Details = Node.create({
  name: "details",
  group: "block",
  content: "detailsSummary detailsContent",
  defining: true,
  addAttributes() {
    return {
      open: { default: true, parseHTML: (el) => el.hasAttribute("open") },
    };
  },
  parseHTML() { return [{ tag: "details" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["details", mergeAttributes(HTMLAttributes, { open: "" }), 0];
  },
  addCommands() {
    return {
      insertDetails:
        () =>
        ({ commands }: { commands: { insertContent: (c: unknown) => boolean } }) => {
          return commands.insertContent({
            type: this.name,
            content: [
              { type: "detailsSummary", content: [{ type: "text", text: "Summary" }] },
              { type: "detailsContent", content: [{ type: "paragraph" }] },
            ],
          });
        },
    } as never;
  },
});
