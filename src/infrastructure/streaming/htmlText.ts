export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/[‘’]/g, "'") // curly apostrophes → ASCII for MLB name matching
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

export function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, "")).trim();
}
