import { useState } from "react";

import { AuthField, AuthNotice, AuthPrimaryButton, AuthScreenShell } from "@/components/auth/ui";
import type { JourneyState } from "@/modules/auth-journey";

interface ChoosePasswordStepProps {
  readonly state: Extract<JourneyState, { step: "choose_password" }>;
  readonly onEmailChange: (email: string) => void;
  readonly onSubmit: (password: string) => void;
}

export function ChoosePasswordStep({ state, onEmailChange, onSubmit }: ChoosePasswordStepProps) {
  const [password, setPassword] = useState("");

  return (
    <AuthScreenShell
      title="Set new password"
      subtitle="Choose a new password, then we'll start a fresh session."
    >
      <AuthField
        kind="email"
        placeholder="Email"
        value={state.email}
        onChangeText={onEmailChange}
      />
      <AuthField
        kind="password"
        placeholder="New Password"
        value={password}
        onChangeText={setPassword}
      />
      <AuthNotice notice={state.notice} />
      <AuthPrimaryButton
        label={state.busy ? "Updating password…" : "Reset Password & Sign In"}
        disabled={state.busy || !password || !state.email}
        onPress={() => onSubmit(password)}
      />
    </AuthScreenShell>
  );
}
