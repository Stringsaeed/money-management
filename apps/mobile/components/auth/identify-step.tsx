import { TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";
import type { JourneyState } from "@/modules/auth-journey";

import { AUTH_FIELD_CLASS } from "./auth-field";
import { AuthNotice } from "./auth-notice";
import { AuthScreenShell } from "./auth-screen-shell";

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
      <Button size="lg" disabled={state.busy || !state.email} onPress={onSendLink}>
        <Text className="font-body-semibold text-white">
          {state.busy ? "Sending link…" : "Send Email Link ✨"}
        </Text>
      </Button>
      <Button variant="outline" size="lg" disabled={state.busy} onPress={onUsePassword}>
        <Text className="font-body-semibold text-ink">Use password instead</Text>
      </Button>
      <View className="gap-1">
        <Button variant="ghost" size="sm" disabled={state.busy} onPress={onCreateProfile}>
          <Text className="font-body-medium text-ink/70">Create profile with password</Text>
        </Button>
        <Button variant="ghost" size="sm" disabled={state.busy} onPress={onForgot}>
          <Text className="font-body-medium text-ink/70">Forgot password?</Text>
        </Button>
      </View>
    </AuthScreenShell>
  );
}
