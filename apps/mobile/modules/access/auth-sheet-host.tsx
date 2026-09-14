import { useEffect, useState } from "react";
import { router } from "expo-router";
import { View } from "react-native";

import { AuthBottomSheet } from "@/components/auth/auth-bottom-sheet";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { beginHostedSignIn } from "@/modules/access/actions";
import { resolveReturnDestination } from "@/modules/access/access";
import { coreFromAccess } from "@/modules/access/core-from-state";
import { hrefForInternal } from "@/modules/access/return-to";
import { useAccess } from "@/modules/access/use-access";

import type { AuthSheetSession } from "./auth-sheet-session";

export function AuthSheetHost({
  session,
  onDismiss,
}: {
  readonly session: AuthSheetSession;
  readonly onDismiss: () => void;
}) {
  // Closed auth must unmount the native sheet entirely. A parked closed sheet
  // can still steal UIKit hits on Create Account submit. Relates #232.
  if (session.kind !== "open") {
    return null;
  }

  return (
    <AuthBottomSheet isPresented onDismiss={onDismiss}>
      <AuthKitSignInPanel session={session} onDismiss={onDismiss} />
    </AuthBottomSheet>
  );
}

function AuthKitSignInPanel({
  session,
  onDismiss,
}: {
  readonly session: Extract<AuthSheetSession, { kind: "open" }>;
  readonly onDismiss: () => void;
}) {
  const access = useAccess();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (access.kind !== "signed_in") return;
    onDismiss();
    router.replace(
      hrefForInternal(resolveReturnDestination(coreFromAccess(access), session.target)),
    );
  }, [access, onDismiss, session.target]);

  async function onContinue() {
    setBusy(true);
    setFailed(false);
    const result = await beginHostedSignIn();
    setBusy(false);
    if (result.kind === "cancelled") {
      onDismiss();
      return;
    }
    if (result.kind === "fail") setFailed(true);
  }

  return (
    <View className="gap-6">
      <View className="gap-2">
        <Text className="font-heading-normal text-2xl italic text-ink">
          Sign in with email code
        </Text>
        <Text className="font-body-normal text-sm text-ink/60">
          We open WorkOS AuthKit. No password. Your local ledger stays on this device.
        </Text>
      </View>
      <View className="gap-4">
        <Text className="font-body-normal text-sm text-ink/70">
          Signing in does not create a Household and does not upload device records.
        </Text>
        {failed ? (
          <Text className="font-body-normal text-sm text-destructive">
            Could not finish sign-in. Check your connection and try again.
          </Text>
        ) : null}
        <Button disabled={busy} onPress={onContinue} className="w-full">
          <Text>{busy ? "Opening AuthKit…" : "Continue with email code"}</Text>
        </Button>
        <Button disabled={busy} onPress={onDismiss} variant="link" className="self-center">
          <Text>Cancel</Text>
        </Button>
      </View>
    </View>
  );
}
