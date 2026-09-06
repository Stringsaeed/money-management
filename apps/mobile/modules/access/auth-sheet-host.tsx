import { useEffect } from "react";

import { AuthBottomSheet } from "@/components/auth/auth-bottom-sheet";
import { ChoosePasswordStep } from "@/components/auth/choose-password-step";
import { SignInStep } from "@/components/auth/sign-in-step";
import { AuthNote, AuthScreenShell } from "@/components/auth/ui";
import { useAuthJourney } from "@/modules/auth-journey";

import type { AuthSheetSession } from "./auth-sheet-session";

export function AuthSheetHost({
  session,
  onDismiss,
}: {
  readonly session: AuthSheetSession;
  readonly onDismiss: () => void;
}) {
  return (
    <AuthBottomSheet isPresented={session.kind === "open"} onDismiss={onDismiss}>
      {session.kind === "open" ? (
        <AuthSheetContents
          key={authSheetContentsKey(session)}
          session={session}
          onDismiss={onDismiss}
        />
      ) : null}
    </AuthBottomSheet>
  );
}

function AuthSheetContents({
  session,
  onDismiss,
}: {
  readonly session: Extract<AuthSheetSession, { kind: "open" }>;
  readonly onDismiss: () => void;
}) {
  const journey = useAuthJourney(
    session.target,
    session.grant ? { grant: session.grant } : undefined,
  );

  useEffect(() => {
    if (journey.state.step === "established") onDismiss();
  }, [journey.state.step, onDismiss]);

  if (journey.state.step === "established") return null;

  if (session.grant) {
    if (journey.state.step !== "choose_password") {
      return (
        <AuthScreenShell
          title="This reset link isn't usable"
          subtitle="Request a new password reset from sign-in."
        >
          <AuthNote>The link may have expired or already been used.</AuthNote>
        </AuthScreenShell>
      );
    }
    return (
      <ChoosePasswordStep
        state={journey.state}
        onEmailChange={(email) => journey.send({ type: "email_changed", email })}
        onSubmit={(password) => journey.send({ type: "submitted_new_password", password })}
      />
    );
  }

  return <SignInStep journey={journey} />;
}

function authSheetContentsKey(session: Extract<AuthSheetSession, { kind: "open" }>): string {
  const target = session.target.kind === "screen" ? session.target.href : session.target.kind;
  return `${target}:${session.grant?.token ?? ""}`;
}
