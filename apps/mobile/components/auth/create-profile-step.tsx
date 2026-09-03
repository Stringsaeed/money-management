import { useState } from "react";
import { Pressable, TextInput } from "react-native";

import { Button } from "@/components/ui/button";
import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";
import type { JourneyState } from "@/modules/auth-journey";

import { AUTH_FIELD_CLASS } from "./auth-field";
import { AuthNotice } from "./auth-notice";
import { AuthScreenShell } from "./auth-screen-shell";

interface CreateProfileStepProps {
  readonly state: Extract<JourneyState, { step: "create_profile" }>;
  readonly onEmailChange: (email: string) => void;
  readonly onNameChange: (displayName: string) => void;
  readonly onSubmit: (input: { readonly password: string; readonly displayName: string }) => void;
  readonly onBack: () => void;
}

export function CreateProfileStep({
  state,
  onEmailChange,
  onNameChange,
  onSubmit,
  onBack,
}: CreateProfileStepProps) {
  const [password, setPassword] = useState("");

  return (
    <AuthScreenShell
      title="Create profile"
      subtitle="Create a profile with a password. Your ledger stays on this device."
    >
      <TextInput
        placeholder="Name"
        autoCapitalize="words"
        value={state.displayName}
        onChangeText={onNameChange}
        placeholderTextColor="#9a9896"
        className={AUTH_FIELD_CLASS}
        style={inputTextStyle}
      />
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={state.email}
        onChangeText={onEmailChange}
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
        onPress={() => onSubmit({ password, displayName: state.displayName })}
      >
        <Text className="font-body-semibold text-white">
          {state.busy ? "Creating account…" : "Create profile with password"}
        </Text>
      </Button>
      <Pressable onPress={onBack} className="py-2">
        <Text className="text-muted-foreground text-center text-sm">
          Already have an account? Sign in
        </Text>
      </Pressable>
    </AuthScreenShell>
  );
}
