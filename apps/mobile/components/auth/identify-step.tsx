import {
  AuthField,
  AuthLinkButton,
  AuthNotice,
  AuthPrimaryButton,
  AuthScreenShell,
  AuthSecondaryButton,
} from "@/components/auth/ui";
import type { JourneyState } from "@/modules/auth-journey";

interface IdentifyStepProps {
  readonly state: Extract<JourneyState, { step: "identify" }>;
  readonly onEmailChange: (email: string) => void;
  readonly onSendLink: () => void;
  readonly onUsePassword: () => void;
  readonly onCreateProfile: () => void;
  readonly onForgot: () => void;
}

export function IdentifyStep({
  state,
  onEmailChange,
  onSendLink,
  onUsePassword,
  onCreateProfile,
  onForgot,
}: IdentifyStepProps) {
  return (
    <AuthScreenShell
      title="Sign in"
      subtitle="Enter your email for a secure link, or use a password instead."
    >
      <AuthField
        kind="email"
        placeholder="Email"
        value={state.email}
        onChangeText={onEmailChange}
      />
      <AuthNotice notice={state.notice} />
      <AuthPrimaryButton
        label={state.busy ? "Sending link…" : "Send Email Link ✨"}
        disabled={state.busy || !state.email}
        onPress={onSendLink}
      />
      <AuthSecondaryButton
        label="Use password instead"
        disabled={state.busy}
        onPress={onUsePassword}
      />
      <AuthLinkButton
        label="Create profile with password"
        disabled={state.busy}
        onPress={onCreateProfile}
      />
      <AuthLinkButton label="Forgot password?" disabled={state.busy} onPress={onForgot} />
    </AuthScreenShell>
  );
}
