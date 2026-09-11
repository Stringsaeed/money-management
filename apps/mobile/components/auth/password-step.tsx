import { useState } from "react";

import {
  AuthField,
  AuthLinkButton,
  AuthNotice,
  AuthPrimaryButton,
  AuthScreenShell,
} from "@/components/auth/ui";
import type { JourneyState } from "@/modules/auth-journey";

interface PasswordStepProps {
  readonly state: Extract<JourneyState, { step: "password" }>;
  readonly onSubmit: (password: string) => void;
  readonly onForgot: () => void;
  readonly onBack: () => void;
}

export function PasswordStep({ state, onSubmit, onForgot, onBack }: PasswordStepProps) {
  const [password, setPassword] = useState("");

  return (
    <AuthScreenShell title="Sign in with password" subtitle="Use the password for this email.">
      <AuthField kind="email" placeholder="Email" value={state.email} editable={false} />
      <AuthField
        kind="password"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />
      <AuthNotice notice={state.notice} />
      <AuthPrimaryButton
        label={state.busy ? "Signing in…" : "Sign in"}
        disabled={state.busy || !state.email || !password}
        onPress={() => onSubmit(password)}
      />
      <AuthLinkButton label="Forgot password?" disabled={state.busy} onPress={onForgot} />
      <AuthLinkButton label="Back to email-first sign-in" onPress={onBack} />
    </AuthScreenShell>
  );
}
