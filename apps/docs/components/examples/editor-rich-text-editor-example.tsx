"use client"

import {
  RichTextEditor,
  type RichTextDocument,
} from "@aq-ui/registry/components/rich-text-editor"

const richDocument: RichTextDocument = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Rich text editor" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Select text to open the " },
        {
          type: "text",
          marks: [{ type: "bold" }],
          text: "bubble menu",
        },
        { type: "text", text: ", or type " },
        { type: "text", marks: [{ type: "code" }], text: "/" },
        { type: "text", text: " to insert a block." },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Canonical Tiptap JSON" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "SSR-safe initialization" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Tables, links, and media" }],
            },
          ],
        },
      ],
    },
  ],
}

function RichTextEditorExample() {
  return (
    <div className="w-full max-w-4xl">
      <RichTextEditor
        defaultValue={richDocument}
        contentClassName="min-h-72"
        placeholder="Write a release note…"
      />
    </div>
  )
}

export default RichTextEditorExample
