import { Pressable } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { JourneyState } from "@/modules/auth-journey";

import { AuthNotice } from "./auth-notice";
import { AuthScreenShell } from "./auth-screen-shell";

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
      <Button size="lg" disabled={state.busy} onPress={onResend}>
        <Text className="font-body-semibold text-white">
          {state.busy ? "Sending…" : "Resend link ✨"}
        </Text>
      </Button>
      <Pressable onPress={onBack} className="py-2">
        <Text className="text-muted-foreground text-center text-sm">Use a different email</Text>
      </Pressable>
    </AuthScreenShell>
  );
}
