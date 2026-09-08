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
import { cn } from "@/lib/utils";

import { fieldBorderClassName, fieldPlaceholderColor, fieldTextStyle } from "./field-style";

const hostFill = StyleSheet.create({
  fill: { flex: 1 },
});

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
      className={cn(
        "flex-1 flex-row items-center rounded-xl border bg-surface-container px-4 py-2.5",
        fieldBorderClassName({ focused, error }),
        !editable && "opacity-50",
      )}
    >
      <Host style={hostFill.fill} matchContents={{ vertical: true }}>
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
