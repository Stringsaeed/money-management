import { Column, ScrollView } from "@expo/ui";
import type { ReactElement, ReactNode } from "react";

import { AuthHost } from "./auth-host";
import { AuthText } from "./auth-text";
import { AUTH_SHELL_SPEC, type AuthSealedChrome } from "./roles";
import { shellColumnModifiers } from "./shell-layout";

export interface AuthScreenShellProps extends AuthSealedChrome {
  readonly title: string;
  readonly subtitle: string;
  readonly children: ReactNode;
}

export function AuthScreenShell({ title, subtitle, children }: AuthScreenShellProps): ReactElement {
  const columnModifiers = [...shellColumnModifiers()];
  return (
    <AuthHost>
      <ScrollView style={{ width: "100%" }}>
        <Column spacing={AUTH_SHELL_SPEC.headerSpacing} modifiers={columnModifiers}>
          <AuthText role="title">{title}</AuthText>
          <AuthText role="subtitle">{subtitle}</AuthText>
        </Column>
        <Column
          spacing={AUTH_SHELL_SPEC.bodySpacing}
          style={{ paddingTop: AUTH_SHELL_SPEC.bodyTopPadding }}
          modifiers={columnModifiers}
        >
          {children}
        </Column>
      </ScrollView>
    </AuthHost>
  );
}
