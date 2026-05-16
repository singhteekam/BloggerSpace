import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audio: {
      insertAudio: (options: { src: string; title?: string }) => ReturnType;
    };
  }
}

export const Audio = Node.create({
  name: "audio",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "audio[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "audio",
      mergeAttributes(HTMLAttributes, { controls: "", preload: "metadata" }),
    ];
  },
  addCommands() {
    return {
      insertAudio:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    };
  },
});
