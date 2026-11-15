import { PressableScale } from "../pressable-scale";
import { SelectChipContent } from "./select-chip-content";
import { chipBody, chipPressedStyle } from "./select-chip-styles";
import {
  DEFAULT_CHIP_SIZE,
  labelWithMeta,
  type SelectChipSize,
  type SelectChipVariant,
} from "./utils";

export type SelectChipRole = "radio" | "checkbox" | "button";

export interface SelectChipProps {
  /**
   * solid: single choice, accent fill when selected (payday) · check: multi-select, tinted with
   * a tick (envelopes) · envelope: single choice with a mono `meta` (Quick add) · add: dashed
   * "Add …" action with a plus.
   */
  variant?: SelectChipVariant;
  label: string;
  /** Leading emoji (user data or design copy). Ignored by `add`. */
  emoji?: string;
  /** Mono figure after the label, e.g. what is left in an envelope ("148"). */
  meta?: string;
  selected?: boolean;
  onPress: () => void;
  /** md 38pt · lg 40pt. Defaults per variant to the screen boards: solid and envelope lg, others md. */
  size?: SelectChipSize;
  /** Defaults per variant: solid/envelope radio, check checkbox, add button. */
  accessibilityRole?: SelectChipRole;
  /** Defaults to the label, plus the meta when there is one. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const DEFAULT_ROLE = {
  solid: "radio",
  check: "checkbox",
  envelope: "radio",
  add: "button",
} as const satisfies Record<SelectChipVariant, SelectChipRole>;

/** Lifts a 38–40pt chip to the 44pt touch target. */
const HIT_SLOP = { top: 3, bottom: 3 } as const;

/** Pill choice chip of the budgeting flows. */
export function SelectChip({
  variant = "solid",
  label,
  emoji,
  meta,
  selected = false,
  onPress,
  size = DEFAULT_CHIP_SIZE[variant],
  accessibilityRole = DEFAULT_ROLE[variant],
  accessibilityLabel = labelWithMeta(label, meta),
  accessibilityHint,
  testID,
}: SelectChipProps) {
  return (
    <PressableScale
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityRole === "button" ? undefined : { checked: selected }}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      pressedStyle={chipPressedStyle(variant, selected)}
      style={chipBody(variant, size, Boolean(emoji), selected)}
      testID={testID}
    >
      <SelectChipContent
        emoji={emoji}
        label={label}
        meta={meta}
        selected={selected}
        size={size}
        variant={variant}
      />
    </PressableScale>
  );
}
