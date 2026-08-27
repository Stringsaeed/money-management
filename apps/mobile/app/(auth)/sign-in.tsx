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
 * Opt-in email-first authentication journey supporting email links, password fallback,
 * profile creation, and password recovery.
 */
export default function SignInScreen() {
  const [mode, setMode] = useState<"email-first" | "password-sign-in" | "sign-up" | "forgot">(
    "email-first",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleMagicLink() {
    if (!email) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const result = await authClient.signIn.magicLink({
        email,
        callbackURL: "trove://",
      });
      if (result.error) {
        setError(result.error.message ?? "Something went wrong. Please try again.");
        return;
      }
      setMessage(
        "Check your email for a secure sign-in link. (Same confirmation for any submitted email address.)",
      );
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordSignIn() {
    if (!email || !password) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? "Invalid email or password.");
        return;
      }
      router.back();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    if (!email || !password) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: name.trim() || email,
      });
      if (result.error) {
        setError(result.error.message ?? "Could not create account.");
        return;
      }
      router.back();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: "trove://reset-password",
      });
      if (result.error) {
        setError(result.error.message ?? "Could not send reset email.");
        return;
      }
      setMessage(
        "If an account exists with this email, password reset instructions have been sent.",
      );
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
            {mode === "sign-up"
              ? "Create profile"
              : mode === "forgot"
                ? "Reset password"
                : mode === "password-sign-in"
                  ? "Sign in with password"
                  : "Sign in"}
          </Text>
          <Text className="text-muted-foreground text-base">
            {mode === "sign-up"
              ? "Create a profile with a password. Your ledger stays on this device."
              : mode === "forgot"
                ? "Enter your email to receive a password reset link."
                : "Enter your email for a secure email link or sign in with your password."}
          </Text>
        </View>

        <View className="mt-8 gap-3">
          {mode === "sign-up" ? (
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

          {mode === "password-sign-in" || mode === "sign-up" ? (
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
          ) : null}

          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
          {message ? <Text className="text-sage text-sm font-body-medium">{message}</Text> : null}

          {mode === "email-first" ? (
            <>
              <Button size="lg" onPress={handleMagicLink} disabled={busy || !email}>
                <Text className="font-body-semibold text-white">
                  {busy ? "Sending link…" : "Send Email Link ✨"}
                </Text>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onPress={() => setMode("password-sign-in")}
                disabled={busy}
              >
                <Text className="font-body-semibold text-ink">Use password instead</Text>
              </Button>

              <Button variant="ghost" size="sm" onPress={() => setMode("sign-up")} disabled={busy}>
                <Text className="font-body-medium text-ink/70">Create profile with password</Text>
              </Button>

              <Button variant="ghost" size="sm" onPress={() => setMode("forgot")} disabled={busy}>
                <Text className="font-body-medium text-ink/70">Forgot password?</Text>
              </Button>
            </>
          ) : mode === "password-sign-in" ? (
            <>
              <Button
                size="lg"
                onPress={handlePasswordSignIn}
                disabled={busy || !email || !password}
              >
                <Text className="font-body-semibold text-white">
                  {busy ? "Signing in…" : "Sign in"}
                </Text>
              </Button>

              <Pressable onPress={() => setMode("email-first")} className="py-2">
                <Text className="text-muted-foreground text-center text-sm">
                  Back to email-first sign-in
                </Text>
              </Pressable>
            </>
          ) : mode === "sign-up" ? (
            <>
              <Button size="lg" onPress={handleSignUp} disabled={busy || !email || !password}>
                <Text className="font-body-semibold text-white">
                  {busy ? "Creating account…" : "Create profile with password"}
                </Text>
              </Button>

              <Pressable onPress={() => setMode("email-first")} className="py-2">
                <Text className="text-muted-foreground text-center text-sm">
                  Already have an account? Sign in
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Button size="lg" onPress={handleForgotPassword} disabled={busy || !email}>
                <Text className="font-body-semibold text-white">
                  {busy ? "Sending reset link…" : "Send Reset Link"}
                </Text>
              </Button>

              <Pressable onPress={() => setMode("email-first")} className="py-2">
                <Text className="text-muted-foreground text-center text-sm">Back to sign in</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
