export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function plainTextLines(lines: Array<string | false | undefined | null>): string {
  return lines.filter(Boolean).join("\n\n");
}
