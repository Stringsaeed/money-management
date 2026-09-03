import { Pressable, TextInput } from "react-native";

import { Button } from "@/components/ui/button";
import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";
import type { JourneyState } from "@/modules/auth-journey";

import { AUTH_FIELD_CLASS } from "./auth-field";
import { AuthNotice } from "./auth-notice";
import { AuthScreenShell } from "./auth-screen-shell";

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
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={state.email}
        onChangeText={onEmailChange}
        placeholderTextColor="#9a9896"
        className={AUTH_FIELD_CLASS}
        style={inputTextStyle}
      />
      <AuthNotice notice={state.notice} />
      <Button size="lg" disabled={state.busy || !state.email} onPress={onSubmit}>
        <Text className="font-body-semibold text-white">
          {state.busy ? "Sending reset link…" : "Send Reset Link"}
        </Text>
      </Button>
      <Pressable onPress={onBack} className="py-2">
        <Text className="text-muted-foreground text-center text-sm">Back to sign in</Text>
      </Pressable>
    </AuthScreenShell>
  );
}
