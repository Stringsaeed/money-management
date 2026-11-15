import {
  StyleSheet,
  Text as NativeText,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";

import { colors, DENSE_MAX_FONT_SCALE } from "@/ui/trove";

import {
  FONT,
  fieldLabelStyle,
  fieldStyles,
  HEIGHT,
  type FieldFont,
  type FieldRowHeight,
} from "./field-styles";

interface FieldInputRowProps {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder?: string;
  /** Fixed label column (118 on Add a big payment); omitted, the label takes its own width. */
  readonly labelWidth?: number;
  readonly font: FieldFont;
  /** Printed before the value, e.g. the currency code "AED". */
  readonly prefix?: string;
  readonly keyboardType?: KeyboardTypeOptions;
  readonly maxLength?: number;
  readonly height?: FieldRowHeight;
}

/** A form row whose value is typed in place, right-aligned after its label. */
export function FieldInputRow({
  label,
  value,
  onChangeText,
  placeholder,
  labelWidth,
  font,
  prefix,
  keyboardType,
  maxLength,
  height = 52,
}: FieldInputRowProps) {
  return (
    <View style={[fieldStyles.row, HEIGHT[height]]}>
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={labelWidth === undefined ? fieldStyles.label : fieldLabelStyle(labelWidth)}
      >
        {label}
      </NativeText>
      <View style={styles.value}>
        {prefix ? (
          <NativeText
            accessibilityElementsHidden
            importantForAccessibility="no"
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            style={[fieldStyles.value, FONT[font], styles.prefix]}
          >
            {prefix}
          </NativeText>
        ) : null}
        <TextInput
          accessibilityLabel={prefix ? `${label}, ${prefix}` : label}
          keyboardType={keyboardType}
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          maxLength={maxLength}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          selectionColor={colors.accent.fill}
          style={[fieldStyles.value, FONT[font], styles.input]}
          value={value}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  value: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 4,
    justifyContent: "flex-end",
  },
  prefix: { color: colors.text.secondary },
  // Fills the row so the whole value side is tappable; the text stays right-aligned.
  input: { flex: 1, minHeight: 44, paddingVertical: 0, textAlign: "right" },
});
