export const FALLBACK_CATEGORY_EMOJI = "🏷️";

/** Category icons may be emoji or legacy icon slugs ("tag"); only emoji render inline. */
export function isCategoryEmoji(icon: string | undefined): icon is string {
  return !!icon && !/^[\w-]+$/.test(icon);
}

/** The Category's emoji, or the tag for a missing icon or a legacy icon slug. */
export function categoryEmoji(icon: string | undefined): string {
  return isCategoryEmoji(icon) ? icon : FALLBACK_CATEGORY_EMOJI;
}
