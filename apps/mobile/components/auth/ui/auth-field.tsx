import { TextInput, useNativeState } from "@expo/ui";
import { useEffect, type ReactElement } from "react";

import { useAuthPaletteContext } from "./auth-host";
import { fieldRecipe } from "./recipes";
import {
  AUTH_FIELD_KINDS,
  AUTH_FIELD_SPEC,
  type AuthFieldKind,
  type AuthFieldKindPreset,
  type AuthSealedChrome,
} from "./roles";

export interface AuthFieldProps extends AuthSealedChrome {
  readonly kind: AuthFieldKind;
  readonly placeholder: string;
  readonly value?: string;
  readonly onChangeText?: (text: string) => void;
  readonly editable?: boolean;
  readonly testID?: string;
}

export function AuthField({
  kind,
  placeholder,
  value,
  onChangeText,
  editable = true,
  testID,
}: AuthFieldProps): ReactElement {
  const preset: AuthFieldKindPreset = AUTH_FIELD_KINDS[kind];
  const palette = useAuthPaletteContext();
  const { style, textStyle, modifiers } = fieldRecipe(palette);
  const state = useNativeState(value ?? "");

  useEffect(() => {
    if (value !== undefined && state.value !== value) {
      state.value = value;
    }
  }, [state, value]);

  return (
    <TextInput
      value={state}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={AUTH_FIELD_SPEC.placeholderColor}
      editable={editable}
      secureTextEntry={preset.secure}
      autoCapitalize={preset.autoCapitalize}
      autoComplete={preset.autoComplete}
      keyboardType={preset.keyboardType}
      autoCorrect={false}
      style={style}
      textStyle={textStyle}
      modifiers={modifiers ? [...modifiers] : undefined}
      testID={testID}
    />
  );
}
