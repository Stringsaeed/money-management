import { Text } from "@expo/ui";
import type { ReactElement } from "react";

import { noticeCopy } from "@/modules/auth-journey/copy";
import type { Notice } from "@/modules/auth-journey/types";

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

export function AuthNotice({
  notice,
}: AuthSealedChrome & { readonly notice: Notice | null }): ReactElement | null {
  if (!notice) return null;
  const role = notice.kind === "link_sent" ? "notice-success" : "notice-error";
  return <AuthText role={role}>{noticeCopy(notice)}</AuthText>;
}

export function AuthNote({
  children,
}: AuthSealedChrome & { readonly children: string }): ReactElement {
  return <AuthText role="note">{children}</AuthText>;
}

export { AuthText };
