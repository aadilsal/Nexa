/** Strip unresolved AI placeholders and tidy spacing for display. */
export function sanitizeInsight(text: string): string {
  return text
    .replace(/\[(amount|date|percent|currency|name)\]/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/([.,;:])\s*([.,;:])/g, "$1")
    .trim();
}
