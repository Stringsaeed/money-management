import { Button, Text } from "@expo/ui";
import type { ReactElement } from "react";

import { useAuthPaletteContext } from "./auth-host";
import { controlRecipe } from "./recipes";
import { type AuthControlRole, type AuthSealedChrome } from "./roles";

export interface AuthButtonProps extends AuthSealedChrome {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly testID?: string;
}

/**
 * iOS: string `label` + chrome modifiers on the button (custom Text children hug width).
 * Android/web: Text child keeps CVA-equivalent textStyle from the recipe.
 */
function AuthButton({
  role,
  label,
  onPress,
  disabled = false,
  testID,
}: AuthButtonProps & { readonly role: AuthControlRole }): ReactElement {
  const palette = useAuthPaletteContext();
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

export function AuthPrimaryButton(props: AuthButtonProps): ReactElement {
  return <AuthButton {...props} role="primary" />;
}

export function AuthSecondaryButton(props: AuthButtonProps): ReactElement {
  return <AuthButton {...props} role="secondary" />;
}

export function AuthLinkButton(props: AuthButtonProps): ReactElement {
  return <AuthButton {...props} role="tertiary" />;
}
