import type { Extensions, JSONContent } from "@tiptap/core"
import { generateHTML, generateJSON } from "@tiptap/html"

interface RichTextHTMLConversionOptions {
  /**
   * Use the same schema extensions that produced the document. Keeping the
   * list explicit prevents a server conversion from silently dropping custom
   * nodes or marks.
   */
  extensions: Extensions
}

/** Convert canonical Tiptap JSON to HTML without creating an editor instance. */
function generateRichTextHTML(
  value: JSONContent,
  { extensions }: RichTextHTMLConversionOptions
) {
  return generateHTML(value, extensions)
}

/** Parse HTML into canonical Tiptap JSON without creating an editor instance. */
function parseRichTextHTML(
  value: string,
  { extensions }: RichTextHTMLConversionOptions
) {
  return generateJSON(value, extensions) as JSONContent
}

export { generateRichTextHTML, parseRichTextHTML }
export type { RichTextHTMLConversionOptions }
