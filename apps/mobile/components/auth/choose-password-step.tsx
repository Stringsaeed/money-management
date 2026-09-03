import { useState } from "react";
import { TextInput } from "react-native";

import { Button } from "@/components/ui/button";
import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";
import type { JourneyState } from "@/modules/auth-journey";

import { AUTH_FIELD_CLASS } from "./auth-field";
import { AuthNotice } from "./auth-notice";
import { AuthScreenShell } from "./auth-screen-shell";

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
      <TextInput
        placeholder="New Password"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#9a9896"
        className={AUTH_FIELD_CLASS}
        style={inputTextStyle}
      />
      <AuthNotice notice={state.notice} />
      <Button
        size="lg"
        disabled={state.busy || !password || !state.email}
        onPress={() => onSubmit(password)}
      >
        <Text className="font-body-semibold text-white">
          {state.busy ? "Updating password…" : "Reset Password & Sign In"}
        </Text>
      </Button>
    </AuthScreenShell>
  );
}
