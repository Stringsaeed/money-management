import { radius } from "../tokens";

/** Line height of the note text, single and multiline. */
export const NOTE_LINE_HEIGHT = 24;
/** The multiline field grows to this many lines, then scrolls. */
export const NOTE_MAX_LINES = 6;

/** How many lines the text takes, from the content height the input reports. At least one. */
export function noteLineCount(contentHeight: number): number {
  return Math.max(1, Math.round(contentHeight / NOTE_LINE_HEIGHT));
}

/** A pill cannot hold paragraphs: once the text wraps the corner radius steps from full to lg. */
export function noteRadius(lines: number): number {
  return lines > 1 ? radius.lg : radius.full;
}

/** Tallest the text area gets before it scrolls. */
export const NOTE_MAX_TEXT_HEIGHT = NOTE_LINE_HEIGHT * NOTE_MAX_LINES;

/** "84 / 280", shown under a multiline note that has a length limit. */
export function noteCounter(length: number, maxLength: number): string {
  return `${length} / ${maxLength}`;
}
