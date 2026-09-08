import { Button, Text } from "@expo/ui";
import type { ReactElement } from "react";

import { useNativePaletteContext } from "./native-host";
import { controlRecipe } from "./recipes";
import { type NativeControlRole, type NativeSealedChrome } from "./roles";

export interface NativeButtonProps extends NativeSealedChrome {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly testID?: string;
}

function NativeButton({
  role,
  label,
  onPress,
  disabled = false,
  testID,
}: NativeButtonProps & { readonly role: NativeControlRole }): ReactElement {
  const palette = useNativePaletteContext();
  const { control, label: labelRecipe } = controlRecipe(role, palette, disabled);
  const useNativeLabel = labelRecipe.modifiers == null && labelRecipe.textStyle == null;

  if (useNativeLabel) {
    return (
      <Button
        variant="text"
        label={label}
        onPress={onPress}
        disabled={disabled}
        testID={testID}
        style={control.style}
        modifiers={control.modifiers ? [...control.modifiers] : undefined}
      />
    );
  }

  return (
    <Button
      variant="text"
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={control.style}
      modifiers={control.modifiers ? [...control.modifiers] : undefined}
    >
      <Text
        textStyle={labelRecipe.textStyle}
        modifiers={labelRecipe.modifiers ? [...labelRecipe.modifiers] : undefined}
      >
        {label}
      </Text>
    </Button>
  );
}

export function NativePrimaryButton(props: NativeButtonProps): ReactElement {
  return <NativeButton {...props} role="primary" />;
}

export function NativeSecondaryButton(props: NativeButtonProps): ReactElement {
  return <NativeButton {...props} role="secondary" />;
}

export function NativeTertiaryButton(props: NativeButtonProps): ReactElement {
  return <NativeButton {...props} role="tertiary" />;
}

export function NativeDestructiveButton(props: NativeButtonProps): ReactElement {
  return <NativeButton {...props} role="destructive" />;
}
