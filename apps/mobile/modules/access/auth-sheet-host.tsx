import { useEffect, useState } from "react";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AuthBottomSheet } from "@/components/auth/auth-bottom-sheet";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { beginHostedSignIn } from "@/modules/access/actions";
import { resolveReturnDestination } from "@/modules/access/access";
import { coreFromAccess } from "@/modules/access/core-from-state";
import { hrefForInternal } from "@/modules/access/return-to";
import { useAccess } from "@/modules/access/use-access";
import { colors, spacing, typography } from "@/lib/design-tokens";

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
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>Sign in with email code</Text>
        <Text style={styles.subtitle}>
          We open WorkOS AuthKit. No password. Your local ledger stays on this device.
        </Text>
      </View>
      <View style={styles.actions}>
        <Text style={styles.note}>
          Signing in does not create a Household and does not upload device records.
        </Text>
        {failed ? (
          <Text style={styles.error}>
            Could not finish sign-in. Check your connection and try again.
          </Text>
        ) : null}
        <Button disabled={busy} onPress={onContinue} style={styles.fullWidth}>
          <Text>{busy ? "Opening AuthKit…" : "Continue with email code"}</Text>
        </Button>
        <Button disabled={busy} onPress={onDismiss} variant="link" style={styles.cancel}>
          <Text>Cancel</Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing[6],
  },
  header: {
    gap: spacing[2],
  },
  title: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.text2xl,
    fontStyle: "italic",
    color: colors.ink,
  },
  subtitle: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.6,
  },
  actions: {
    gap: spacing[4],
  },
  note: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.7,
  },
  error: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.destructive,
  },
  fullWidth: {
    width: "100%",
  },
  cancel: {
    alignSelf: "center",
  },
});
