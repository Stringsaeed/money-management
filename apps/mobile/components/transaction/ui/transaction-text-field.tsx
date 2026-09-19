import { Host, TextInput, useNativeState } from "@expo/ui";
import { useEffect, useState, type ReactElement } from "react";
import {
  StyleSheet,
  useColorScheme,
  View,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
} from "react-native";

import { useGraphicPalette } from "@/components/graphics/palette";
import { colors, radii, spacing } from "@/lib/design-tokens";

import { fieldBorderColor, fieldPlaceholderColor, fieldTextStyle } from "./field-style";

export interface TransactionTextFieldProps {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
  readonly editable?: boolean;
  readonly error?: boolean;
  readonly accessibilityLabel?: string;
  readonly keyboardType?: KeyboardTypeOptions;
  readonly autoCapitalize?: "none" | "sentences" | "words" | "characters";
  readonly returnKeyType?: ReturnKeyTypeOptions;
  readonly onSubmitEditing?: (text: string) => void;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
  readonly testID?: string;
}

export function TransactionTextField({
  value,
  onChangeText,
  placeholder,
  editable = true,
  error = false,
  accessibilityLabel,
  keyboardType,
  autoCapitalize,
  returnKeyType,
  onSubmitEditing,
  onFocus,
  onBlur,
  testID,
}: TransactionTextFieldProps): ReactElement {
  const [focused, setFocused] = useState(false);
  const colorScheme = useColorScheme();
  const { ink } = useGraphicPalette();
  const state = useNativeState(value);

  useEffect(() => {
    if (state.value !== value) {
      state.value = value;
    }
  }, [state, value]);

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.container,
        { borderColor: fieldBorderColor({ focused, error }) },
        !editable && styles.containerDisabled,
      ]}
    >
      <Host style={styles.host} matchContents={{ vertical: true }}>
        <TextInput
          value={state}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={fieldPlaceholderColor(colorScheme)}
          editable={editable}
          autoCorrect={false}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          textStyle={fieldTextStyle(ink)}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
        />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.xl,
    borderWidth: 1,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
  },
  containerDisabled: {
    opacity: 0.5,
  },
  host: {
    flex: 1,
  },
});
