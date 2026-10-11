export interface HighlightParts {
  readonly pre: string;
  readonly hit: string;
  readonly post: string;
}

/**
 * Splits `text` around the first case-insensitive match of `query`, as the server matches notes.
 * `null` when there is no query or no match, so the title prints plain.
 */
export function highlightParts(text: string, query: string): HighlightParts | null {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return null;
  const start = text.toLocaleLowerCase().indexOf(needle);
  if (start < 0) return null;
  const end = start + needle.length;
  return { pre: text.slice(0, start), hit: text.slice(start, end), post: text.slice(end) };
}
