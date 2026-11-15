import { Text as NativeText } from "react-native";

import { Icon } from "../icon";
import { colors, DENSE_MAX_FONT_SCALE } from "../tokens";
import { chipLabelStyle, chipToneStyle, emojiStyles, partStyles } from "./select-chip-styles";
import type { SelectChipSize, SelectChipVariant } from "./utils";

interface SelectChipContentProps {
  variant: SelectChipVariant;
  size: SelectChipSize;
  label: string;
  emoji?: string;
  meta?: string;
  selected: boolean;
}

/** Plus (add) or emoji, the label, a mono meta, and the tick of a check chip. */
export function SelectChipContent({
  variant,
  size,
  label,
  emoji,
  meta,
  selected,
}: SelectChipContentProps) {
  const tone = chipToneStyle(variant, selected);
  const isAdd = variant === "add";

  return (
    <>
      {isAdd ? (
        <Icon color={colors.text.secondary} name="add" size={14} strokeWidth={2.25} />
      ) : null}
      {emoji && !isAdd ? (
        <NativeText
          accessibilityElementsHidden
          importantForAccessibility="no"
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={emojiStyles[size]}
        >
          {emoji}
        </NativeText>
      ) : null}
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[chipLabelStyle(variant, size), tone]}
      >
        {label}
      </NativeText>
      {meta && !isAdd ? (
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={[partStyles.meta, tone]}>
          {meta}
        </NativeText>
      ) : null}
      {variant === "check" ? (
        // Always laid out so ticking a chip never changes its width.
        <NativeText
          accessibilityElementsHidden
          importantForAccessibility="no"
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={[partStyles.tick, tone, selected ? null : partStyles.tickHidden]}
        >
          ✓
        </NativeText>
      ) : null}
    </>
  );
}
