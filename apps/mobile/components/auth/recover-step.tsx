import {
  AuthField,
  AuthLinkButton,
  AuthNotice,
  AuthPrimaryButton,
  AuthScreenShell,
} from "@/components/auth/ui";
import type { JourneyState } from "@/modules/auth-journey";

interface RecoverStepProps {
  readonly state: Extract<JourneyState, { step: "recover" }>;
  readonly onEmailChange: (email: string) => void;
  readonly onSubmit: () => void;
  readonly onBack: () => void;
}

export function RecoverStep({ state, onEmailChange, onSubmit, onBack }: RecoverStepProps) {
  return (
    <AuthScreenShell
      title="Reset password"
      subtitle="Enter your email to receive a password reset link."
    >
      <AuthField
        kind="email"
        placeholder="Email"
        value={state.email}
        onChangeText={onEmailChange}
      />
      <AuthNotice notice={state.notice} />
      <AuthPrimaryButton
        label={state.busy ? "Sending reset link…" : "Send Reset Link"}
        disabled={state.busy || !state.email}
        onPress={onSubmit}
      />
      <AuthLinkButton label="Back to sign in" onPress={onBack} />
    </AuthScreenShell>
  );
}
