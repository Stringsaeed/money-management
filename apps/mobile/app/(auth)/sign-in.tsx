import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";

const fieldClass = "border border-input rounded-[10px] p-3.5 text-base leading-5 text-foreground";

/**
 * Opt-in email + password authentication. Local-only mode never routes here;
 * signing in unlocks household features while the ledger stays on device.
 */
export default function SignInScreen() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === "sign-up";

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ email, password, name: name.trim() || email })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? "Something went wrong. Please try again.");
        return;
      }
      router.back();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 pb-safe pt-safe"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <Text className="font-heading-medium italic text-4xl tracking-tight">
            {isSignUp ? "Create account" : "Welcome back"}
          </Text>
          <Text className="text-muted-foreground text-base">
            {isSignUp
              ? "Sign up to share a household with family. Your ledger stays on this device."
              : "Sign in to reach your shared household. Your ledger stays on this device."}
          </Text>
        </View>

        <View className="mt-8 gap-3">
          {isSignUp ? (
            <TextInput
              placeholder="Name"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#9a9896"
              className={fieldClass}
              style={inputTextStyle}
            />
          ) : null}
          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#9a9896"
            className={fieldClass}
            style={inputTextStyle}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#9a9896"
            className={fieldClass}
            style={inputTextStyle}
          />
          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
          <Button size="lg" onPress={handleSubmit} disabled={busy || !email || !password}>
            <Text className="font-body-semibold text-white">
              {busy ? "Please wait…" : isSignUp ? "Sign up" : "Sign in"}
            </Text>
          </Button>
          <Pressable
            onPress={() => {
              setError(null);
              setMode(isSignUp ? "sign-in" : "sign-up");
            }}
            className="py-2"
          >
            <Text className="text-muted-foreground text-center text-sm">
              {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
