import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";

const fieldClass = "border border-input rounded-[10px] p-3.5 text-base leading-5 text-foreground";

/**
 * Dedicated reset-password screen for token handling and entering a new password.
 * Completed password reset creates a fresh authentication session.
 */
export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleReset() {
    if (!password || !token) {
      setError("Missing reset token or password.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (result.error) {
        setError(result.error.message ?? "Could not reset password. The link may have expired.");
        return;
      }
      router.replace("/(tabs)/settings/household");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-surface"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 pb-safe pt-safe"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <Text className="font-heading-medium italic text-4xl tracking-tight text-ink">
            Set new password
          </Text>
          <Text className="text-muted-foreground text-base">
            Enter your new password below to secure your account and start a fresh session.
          </Text>
        </View>

        <View className="mt-8 gap-3">
          <TextInput
            placeholder="New Password"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#9a9896"
            className={fieldClass}
            style={inputTextStyle}
          />

          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

          <Button size="lg" onPress={handleReset} disabled={busy || !password || !token}>
            <Text className="font-body-semibold text-white">
              {busy ? "Updating password…" : "Reset Password & Sign In"}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
