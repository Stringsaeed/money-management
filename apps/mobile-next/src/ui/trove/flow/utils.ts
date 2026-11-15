/** Padding plus ring of the KindSwitch track: the board's 4pt inset includes the 1pt ring. */
export const KIND_TRACK_INSET = 4;
export const KIND_TRACK_RING = 1;
export const KIND_TRACK_GAP = 4;

export interface KindThumbLayout {
  /** Offset from the track's padding edge (inside the ring). */
  x: number;
  width: number;
}

/** Selected-tab thumb for an equal-width KindSwitch track `trackWidth` wide (ring included). */
export function kindThumbLayout(trackWidth: number, count: number, index: number): KindThumbLayout {
  if (trackWidth <= 0 || count <= 0) return { x: 0, width: 0 };
  const inner = trackWidth - KIND_TRACK_INSET * 2 - KIND_TRACK_GAP * (count - 1);
  const width = inner / count;
  return { x: index * (width + KIND_TRACK_GAP), width };
}

/** Segments of a step progress bar: the first `step` are done. Clamped to 0…of. */
export function stepSegments(step: number, of: number): readonly boolean[] {
  const total = Math.max(0, Math.floor(of));
  const done = Math.min(total, Math.max(0, Math.floor(step)));
  return Array.from({ length: total }, (_, index) => index < done);
}

export type SelectChipVariant = "solid" | "check" | "envelope" | "add";
export type SelectChipSize = "md" | "lg";

/** Screen boards: payday (solid) and Quick add envelope chips are 40pt; the rest 38pt. */
export const DEFAULT_CHIP_SIZE = {
  solid: "lg",
  check: "md",
  envelope: "lg",
  add: "md",
} as const satisfies Record<SelectChipVariant, SelectChipSize>;

/** Ring width of a chip. The add chip's dashed 1.5pt border is drawn as a real border. */
export function chipRingWidth(variant: SelectChipVariant, selected: boolean): number {
  if (variant === "add") return 1.5;
  if (variant === "check" && selected) return 1.5;
  return 1;
}

interface ChipPadding {
  paddingLeft: number;
  paddingRight: number;
}

/**
 * The boards draw rings as inset box-shadows that take no space, so the label sits a fixed
 * distance from the outer edge. A native border pushes content in, so the padding gives the
 * ring's width back. The add chip's dashed border is a real CSS border, so it keeps its padding.
 */
export function chipPadding(
  variant: SelectChipVariant,
  size: SelectChipSize,
  hasEmoji: boolean,
  selected: boolean,
): ChipPadding {
  const side = variant === "solid" && size === "lg" ? 16 : 14;
  const start = hasEmoji && variant !== "add" ? 10 : side;
  const ring = variant === "add" ? 0 : chipRingWidth(variant, selected);
  return { paddingLeft: start - ring, paddingRight: side - ring };
}

/** "Dining" or "Dining, 148": a chip's spoken name with its meta. */
export function labelWithMeta(label: string, meta?: string): string {
  return meta ? `${label}, ${meta}` : label;
}

export type ActionBarLayout = "caption" | "outline" | "text" | "row";

interface ActionBarSlots {
  caption?: string;
  secondary?: { appearance?: "outline" | "text" };
}

/** Caption wins (stacked), then a second button (paired), else a left slot beside the primary. */
export function actionBarLayout({ caption, secondary }: ActionBarSlots): ActionBarLayout {
  if (caption !== undefined) return "caption";
  if (!secondary) return "row";
  return secondary.appearance ?? "outline";
}

export type PlanFigureFit = "md" | "sm" | "xs";

/**
 * Size step for a plan amount pill: 16pt fits 8 Plex Mono characters in its 84pt figure box
 * ("1,600.00"), 14pt fits 10 ("150,000.00") and 12pt the rest.
 */
export function planFigureFit(figure: string): PlanFigureFit {
  if (figure.length <= 8) return "md";
  if (figure.length <= 10) return "sm";
  return "xs";
}
