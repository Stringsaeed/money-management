import {
  AuthLinkButton,
  AuthNotice,
  AuthPrimaryButton,
  AuthScreenShell,
} from "@/components/auth/ui";
import type { JourneyState } from "@/modules/auth-journey";

interface RecoverySentStepProps {
  readonly state: Extract<JourneyState, { step: "recovery_sent" }>;
  readonly onResend: () => void;
  readonly onBack: () => void;
}

export function RecoverySentStep({ state, onResend, onBack }: RecoverySentStepProps) {
  return (
    <AuthScreenShell
      title="Check your email"
      subtitle="If that address has an account, a reset link is on the way."
    >
      <AuthNotice notice={state.notice} />
      <AuthPrimaryButton
        label={state.busy ? "Sending…" : "Resend reset link"}
        disabled={state.busy}
        onPress={onResend}
      />
      <AuthLinkButton label="Back to sign in" onPress={onBack} />
    </AuthScreenShell>
  );
}
