import { Text } from "@expo/ui";
import type { ReactElement } from "react";

import { useAuthPaletteContext } from "./auth-host";
import { textRecipe } from "./recipes";
import { type AuthSealedChrome, type AuthTextRole } from "./roles";

function AuthText({ role, children }: { readonly role: AuthTextRole; readonly children: string }) {
  const palette = useAuthPaletteContext();
  const recipe = textRecipe(role, palette);
  return (
    <Text
      textStyle={recipe.textStyle}
      modifiers={recipe.modifiers ? [...recipe.modifiers] : undefined}
    >
      {children}
    </Text>
  );
}

export function AuthNote({
  children,
}: AuthSealedChrome & { readonly children: string }): ReactElement {
  return <AuthText role="note">{children}</AuthText>;
}

export { AuthText };
