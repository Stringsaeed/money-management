const FALLBACK_CATEGORY_EMOJI = "🏷️";

/** Category icons may be emoji or legacy icon slugs ("tag"); only emoji render inline. */
export function categoryEmoji(icon: string | undefined): string {
  if (!icon || /^[\w-]+$/.test(icon)) return FALLBACK_CATEGORY_EMOJI;
  return icon;
}
