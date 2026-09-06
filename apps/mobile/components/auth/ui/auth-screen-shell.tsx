import { Column, ScrollView } from "@expo/ui";
import type { ReactElement, ReactNode } from "react";

import { AuthHost } from "./auth-host";
import { AuthText } from "./auth-text";
import { AUTH_SHELL_SPEC, type AuthSealedChrome } from "./roles";

export interface AuthScreenShellProps extends AuthSealedChrome {
  readonly title: string;
  readonly subtitle: string;
  readonly children: ReactNode;
}

export function AuthScreenShell({ title, subtitle, children }: AuthScreenShellProps): ReactElement {
  return (
    <AuthHost>
      <ScrollView style={{ width: "100%" }}>
        <Column spacing={AUTH_SHELL_SPEC.headerSpacing}>
          <AuthText role="title">{title}</AuthText>
          <AuthText role="subtitle">{subtitle}</AuthText>
        </Column>
        <Column
          spacing={AUTH_SHELL_SPEC.bodySpacing}
          style={{ paddingTop: AUTH_SHELL_SPEC.bodyTopPadding }}
        >
          {children}
        </Column>
      </ScrollView>
    </AuthHost>
  );
}
