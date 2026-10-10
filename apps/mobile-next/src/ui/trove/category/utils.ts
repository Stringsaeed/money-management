import type { ColorMode } from "../tokens";
import { USER_COLOR_SWATCHES, type UserColorSwatch } from "./palette";

/**
 * Raw-colour bridge for user data. A person's category colour is an arbitrary hex stored
 * with their data, so it cannot be a static `colors.*` token (those resolve natively and
 * only exist for the fixed palette). Instead the hex is turned into a tint and a ring here,
 * and the paper/dark choice is made in JS (see `useUserColor`). Text never takes a user
 * colour — only fills and rings do.
 */

/** Tint strength behind a user colour: 18% on paper, 25% on dark. */
export const USER_TINT_ALPHA = { light: 0.18, dark: 0.25 } as const satisfies Record<
  ColorMode,
  number
>;

export interface UserColor {
  /** The user's colour at 18% (paper) or 25% (dark): tile and chip backgrounds. */
  readonly tint: string;
  /** The user's colour at full strength: rings and swatches. */
  readonly ring: string;
}

const SHORT_HEX = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const LONG_HEX = /^#[0-9a-f]{6}$/i;

/** `#RGB` or `#RRGGBB` as upper-case `#RRGGBB`; null for anything else. */
export function normalizeHex(hex: string): string | null {
  const short = SHORT_HEX.exec(hex);
  if (short)
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toUpperCase();
  return LONG_HEX.test(hex) ? hex.toUpperCase() : null;
}

/** `#RRGGBB` plus an alpha byte: `withAlpha("#EB6834", 0.18)` is `#EB683446`. */
export function withAlpha(hex: string, alpha: number): string | null {
  const base = normalizeHex(hex);
  if (!base) return null;
  const byte = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
  return `${base}${byte.toString(16).padStart(2, "0").toUpperCase()}`;
}

/** Tint and ring for a user hex in a colour mode; null when the hex is not a valid colour. */
export function resolveUserColor(hex: string, mode: ColorMode): UserColor | null {
  const ring = normalizeHex(hex);
  const tint = withAlpha(hex, USER_TINT_ALPHA[mode]);
  return ring && tint ? { tint, ring } : null;
}

/** Whether two hex strings are the same colour, ignoring case and short form. */
export function isSameColor(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const left = normalizeHex(a);
  return left !== null && left === normalizeHex(b);
}

/** The palette swatch a hex belongs to, if any. */
export function findSwatch(hex: string | null | undefined): UserColorSwatch | undefined {
  return USER_COLOR_SWATCHES.find((swatch) => isSameColor(swatch.hex, hex));
}

/** Splits items into rows of `columns`; the last row may be short. */
export function chunkRows<T>(items: readonly T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += columns) {
    rows.push(items.slice(index, index + columns));
  }
  return rows;
}
