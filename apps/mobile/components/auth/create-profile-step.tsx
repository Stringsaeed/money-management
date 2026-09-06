import { useState } from "react";

import {
  AuthField,
  AuthLinkButton,
  AuthNotice,
  AuthPrimaryButton,
  AuthScreenShell,
} from "@/components/auth/ui";
import type { JourneyState } from "@/modules/auth-journey";

interface CreateProfileStepProps {
  readonly state: Extract<JourneyState, { step: "create_profile" }>;
  readonly onEmailChange: (email: string) => void;
  readonly onNameChange: (displayName: string) => void;
  readonly onSubmit: (input: { readonly password: string; readonly displayName: string }) => void;
  readonly onBack: () => void;
}

export function CreateProfileStep({
  state,
  onEmailChange,
  onNameChange,
  onSubmit,
  onBack,
}: CreateProfileStepProps) {
  const [password, setPassword] = useState("");

  return (
    <AuthScreenShell
      title="Create profile"
      subtitle="Create a profile with a password. Your ledger stays on this device."
    >
      <AuthField
        kind="name"
        placeholder="Name"
        value={state.displayName}
        onChangeText={onNameChange}
      />
      <AuthField
        kind="email"
        placeholder="Email"
        value={state.email}
        onChangeText={onEmailChange}
      />
      <AuthField
        kind="password"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />
      <AuthNotice notice={state.notice} />
      <AuthPrimaryButton
        label={state.busy ? "Creating account…" : "Create profile with password"}
        disabled={state.busy || !state.email || !password}
        onPress={() => onSubmit({ password, displayName: state.displayName })}
      />
      <AuthLinkButton label="Already have an account? Sign in" onPress={onBack} />
    </AuthScreenShell>
  );
}
