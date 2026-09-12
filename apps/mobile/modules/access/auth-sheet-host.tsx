import { useEffect, useState } from "react";
import { router } from "expo-router";

import { AuthBottomSheet } from "@/components/auth/auth-bottom-sheet";
import { AuthLinkButton, AuthNote, AuthPrimaryButton, AuthScreenShell } from "@/components/auth/ui";
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
  // Closed auth must unmount @expo/ui BottomSheet entirely. A parked
  // isPresented=false Host can still steal UIKit hits on Create Account
  // submit (hittable=true, coord/testID miss at AX center). Relates #232.
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
    <AuthScreenShell
      title="Sign in with email code"
      subtitle="We open WorkOS AuthKit. No password. Your local ledger stays on this device."
    >
      <AuthNote>
        Signing in does not create a Household and does not upload device records.
      </AuthNote>
      {failed ? (
        <AuthNote>Could not finish sign-in. Check your connection and try again.</AuthNote>
      ) : null}
      <AuthPrimaryButton
        label={busy ? "Opening AuthKit…" : "Continue with email code"}
        onPress={onContinue}
        disabled={busy}
      />
      <AuthLinkButton label="Cancel" onPress={onDismiss} disabled={busy} />
    </AuthScreenShell>
  );
}
