export type AvatarSize = 32 | 44 | 64;
export type AvatarScope = "personal" | "household";

/** Glyph size per avatar size: mono initials at 11/14, the user's emoji at half the disc. */
export const INITIALS_FONT_SIZE = { 32: 11, 44: 14, 64: 20 } as const satisfies Record<
  AvatarSize,
  number
>;

export const EMOJI_FONT_SIZE = { 32: 16, 44: 22, 64: 32 } as const satisfies Record<
  AvatarSize,
  number
>;

/** Household corner badge diameter per avatar size. */
export const CORNER_SIZE = { 32: 16, 44: 20, 64: 24 } as const satisfies Record<AvatarSize, number>;

/** Up to two uppercase letters from a name, e.g. "Ada Byron" -> "AB". */
export function initialsFor(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .map((part) => Array.from(part)[0] ?? "");
  const first = letters[0] ?? "";
  const last = letters.length > 1 ? (letters[letters.length - 1] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

/** Spoken name: the explicit label, else the initials, with the scope appended for household. */
export function avatarAccessibilityLabel(
  label: string | undefined,
  initials: string | undefined,
  scope: AvatarScope,
): string {
  const base = label ?? (initials ? initials : "Avatar");
  return scope === "household" ? `${base}, household` : base;
}
