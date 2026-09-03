import { useState } from "react";
import { Pressable, TextInput } from "react-native";

import { Button } from "@/components/ui/button";
import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";
import type { JourneyState } from "@/modules/auth-journey";

import { AUTH_FIELD_CLASS } from "./auth-field";
import { AuthNotice } from "./auth-notice";
import { AuthScreenShell } from "./auth-screen-shell";

interface PasswordStepProps {
  readonly state: Extract<JourneyState, { step: "password" }>;
  readonly onSubmit: (password: string) => void;
  readonly onBack: () => void;
}

export function PasswordStep({ state, onSubmit, onBack }: PasswordStepProps) {
  const [password, setPassword] = useState("");

  return (
    <AuthScreenShell title="Sign in with password" subtitle="Use the password for this email.">
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        value={state.email}
        editable={false}
        className={AUTH_FIELD_CLASS}
        style={inputTextStyle}
      />
      <TextInput
        placeholder="Password"
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
        disabled={state.busy || !state.email || !password}
        onPress={() => onSubmit(password)}
      >
        <Text className="font-body-semibold text-white">
          {state.busy ? "Signing in…" : "Sign in"}
        </Text>
      </Button>
      <Pressable onPress={onBack} className="py-2">
        <Text className="text-muted-foreground text-center text-sm">
          Back to email-first sign-in
        </Text>
      </Pressable>
    </AuthScreenShell>
  );
}
