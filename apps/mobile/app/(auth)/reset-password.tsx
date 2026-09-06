import { useLocalSearchParams } from "expo-router";

import { ChoosePasswordStep } from "@/components/auth/choose-password-step";
import { AuthNote, AuthScreenShell } from "@/components/auth/ui";
import { firstRouteParam, returnTo } from "@/modules/access";
import { useAuthJourney } from "@/modules/auth-journey";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{
    token?: string | string[];
    returnTo?: string | string[];
  }>();
  const token = firstRouteParam(params.token);
  const grant = token ? { token } : undefined;
  const journey = useAuthJourney(
    returnTo.parse(firstRouteParam(params.returnTo)),
    grantSeed(grant),
  );

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

function grantSeed(grant: { readonly token: string } | undefined) {
  if (!grant) return undefined;
  return { grant };
}
