import type { AuthJourneyController } from "@/modules/auth-journey";

import { AwaitLinkStep } from "./await-link-step";
import { CreateProfileStep } from "./create-profile-step";
import { IdentifyStep } from "./identify-step";
import { PasswordStep } from "./password-step";
import { RecoverStep } from "./recover-step";
import { RecoverySentStep } from "./recovery-sent-step";

export function SignInStep({ journey }: { readonly journey: AuthJourneyController }) {
  const { state, send } = journey;

  if (state.step === "identify") {
    return (
      <IdentifyStep
        state={state}
        onEmailChange={(email) => send({ type: "email_changed", email })}
        onSendLink={() => send({ type: "requested_sign_in_link" })}
        onUsePassword={() => send({ type: "chose_password" })}
        onCreateProfile={() => send({ type: "chose_create_profile" })}
        onForgot={() => send({ type: "chose_recovery" })}
      />
    );
  }
  if (state.step === "await_link") {
    return (
      <AwaitLinkStep
        state={state}
        onResend={() => send({ type: "requested_resend" })}
        onBack={() => send({ type: "back_to_identify" })}
      />
    );
  }
  if (state.step === "password") {
    return (
      <PasswordStep
        state={state}
        onSubmit={(password) => send({ type: "submitted_password", password })}
        onBack={() => send({ type: "back_to_identify" })}
      />
    );
  }
  if (state.step === "create_profile") {
    return (
      <CreateProfileStep
        state={state}
        onEmailChange={(email) => send({ type: "email_changed", email })}
        onNameChange={(displayName) => send({ type: "name_changed", displayName })}
        onSubmit={(value) => send({ type: "submitted_new_profile", ...value })}
        onBack={() => send({ type: "back_to_identify" })}
      />
    );
  }
  if (state.step === "recover") {
    return (
      <RecoverStep
        state={state}
        onEmailChange={(email) => send({ type: "email_changed", email })}
        onSubmit={() => send({ type: "requested_recovery_link" })}
        onBack={() => send({ type: "back_to_identify" })}
      />
    );
  }
  if (state.step === "recovery_sent") {
    return (
      <RecoverySentStep
        state={state}
        onResend={() => send({ type: "requested_resend" })}
        onBack={() => send({ type: "back_to_identify" })}
      />
    );
  }
  return null;
}
