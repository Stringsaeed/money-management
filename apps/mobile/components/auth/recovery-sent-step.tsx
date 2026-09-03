import { Pressable } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { JourneyState } from "@/modules/auth-journey";

import { AuthNotice } from "./auth-notice";
import { AuthScreenShell } from "./auth-screen-shell";

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
      <Button size="lg" disabled={state.busy} onPress={onResend}>
        <Text className="font-body-semibold text-white">
          {state.busy ? "Sending…" : "Resend reset link"}
        </Text>
      </Button>
      <Pressable onPress={onBack} className="py-2">
        <Text className="text-muted-foreground text-center text-sm">Back to sign in</Text>
      </Pressable>
    </AuthScreenShell>
  );
}
