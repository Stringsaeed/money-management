import { Text as NativeText } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, Icon, PressableScale, type IconName } from "@/ui/trove";

import {
  FONT,
  fieldLabelStyle,
  fieldStyles,
  HEIGHT,
  type FieldFont,
  type FieldRowHeight,
} from "./field-styles";
import { fieldButtonA11y } from "./field-a11y";

interface FieldButtonRowProps {
  readonly label: string;
  readonly value: string;
  readonly font: FieldFont;
  /** Absent for a value that cannot change here: the row is read-only text. */
  readonly onPress?: () => void;
  /** Fixed label column (118 on Add a big payment); omitted, the label fills the row. */
  readonly labelWidth?: number;
  /** Small icon before the value, e.g. `calendar`. */
  readonly icon?: IconName;
  /** Trailing chevron, as on Mark paid's rows; shown only while the row can be pressed. */
  readonly chevron?: boolean;
  /** Whether the picker it opens is showing. */
  readonly expanded?: boolean;
  readonly height?: FieldRowHeight;
}

/** A form row that opens a picker: label, value, and an optional icon or chevron. */
export function FieldButtonRow({
  label,
  value,
  font,
  onPress,
  labelWidth,
  icon,
  chevron = false,
  expanded,
  height = 52,
}: FieldButtonRowProps) {
  const fixed = labelWidth !== undefined;
  const showChevron = chevron && onPress !== undefined;
  return (
    <PressableScale
      {...fieldButtonA11y(label, value, onPress !== undefined, expanded)}
      disabled={!onPress}
      onPress={onPress}
      pressedStyle={fieldStyles.pressed}
      scaleOnPress={false}
      style={[fieldStyles.row, HEIGHT[height]]}
    >
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={fieldLabelStyle(labelWidth)}>
        {label}
      </NativeText>
      {icon && <Icon color={colors.text.secondary} name={icon} size={17} />}
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[fieldStyles.value, FONT[font], fixed && [fieldStyles.fill, fieldStyles.end]]}
      >
        {value}
      </NativeText>
      {showChevron && (
        <Icon color={colors.text.tertiary} name="chevron-right" size={14} strokeWidth={2} />
      )}
    </PressableScale>
  );
}
