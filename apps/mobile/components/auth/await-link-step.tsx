import {
  AuthLinkButton,
  AuthNotice,
  AuthPrimaryButton,
  AuthScreenShell,
} from "@/components/auth/ui";
import type { JourneyState } from "@/modules/auth-journey";

interface AwaitLinkStepProps {
  readonly state: Extract<JourneyState, { step: "await_link" }>;
  readonly onResend: () => void;
  readonly onBack: () => void;
}

export function AwaitLinkStep({ state, onResend, onBack }: AwaitLinkStepProps) {
  return (
    <AuthScreenShell
      title="Check your email"
      subtitle="Open the sign-in link we sent. Same confirmation for any address."
    >
      <AuthNotice notice={state.notice} />
      <AuthPrimaryButton
        label={state.busy ? "Sending…" : "Resend link ✨"}
        disabled={state.busy}
        onPress={onResend}
      />
      <AuthLinkButton label="Use a different email" onPress={onBack} />
    </AuthScreenShell>
  );
}
