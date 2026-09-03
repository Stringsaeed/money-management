import { addSeconds, isValid, parseISO } from "date-fns";

import type { Identity } from "@/modules/access";

import type {
  JourneyEffect,
  JourneyEvent,
  JourneyState,
  Notice,
  ReduceResult,
  ResetGrant,
} from "./types";

export const RESEND_COOLDOWN_SECONDS = 30;

export function initialIdentifyState(email = ""): Extract<JourneyState, { step: "identify" }> {
  return { step: "identify", email, busy: false, notice: null };
}

export function initialChoosePasswordState(grant: ResetGrant, email = ""): JourneyState {
  return { step: "choose_password", email, busy: false, notice: null, grant };
}

export function reduce(state: JourneyState, event: JourneyEvent, now: Date): ReduceResult {
  if (state.step === "established") return { state, effect: null };
  if (event.type === "session_established") return established(event.user);
  if (event.type === "opened_reset_grant") {
    return idle(initialChoosePasswordState(event.grant, emailOf(state)));
  }
  if (event.type === "attempt_failed") {
    return idle(withNotice(state, { kind: "problem", failure: event.failure }));
  }
  if (event.type === "grant_rejected") {
    return idle(
      withNotice(identifyFrom(state), { kind: "link_unusable", operation: event.operation }),
    );
  }
  return reduceStep(state, event, now);
}

function reduceStep(
  state: Exclude<JourneyState, { step: "established" }>,
  event: JourneyEvent,
  now: Date,
): ReduceResult {
  if (event.type === "email_changed") return idle({ ...state, email: event.email, notice: null });
  if (event.type === "back_to_identify") return idle(identifyFrom(state));
  if (state.step === "identify") return reduceIdentify(state, event, now);
  if (state.step === "await_link") return reduceAwaitLink(state, event, now);
  if (state.step === "password") return reducePassword(state, event);
  if (state.step === "create_profile") return reduceCreateProfile(state, event);
  if (state.step === "recover") return reduceRecover(state, event, now);
  if (state.step === "recovery_sent") return reduceRecoverySent(state, event, now);
  return reduceChoosePassword(state, event);
}

function reduceIdentify(
  state: Extract<JourneyState, { step: "identify" }>,
  event: JourneyEvent,
  now: Date,
) {
  if (event.type === "chose_password") return idle({ ...state, step: "password", notice: null });
  if (event.type === "chose_create_profile") {
    return idle({ ...state, step: "create_profile", displayName: "", notice: null });
  }
  if (event.type === "chose_recovery") return idle({ ...state, step: "recover", notice: null });
  if (event.type === "requested_sign_in_link" && state.email) {
    return busy(state, { kind: "send_link", email: state.email, operation: "sign_in" });
  }
  if (event.type === "link_dispatched" && event.operation === "sign_in") {
    return idle(awaitLink(state, event.at, now));
  }
  return idle(state);
}

function reduceAwaitLink(
  state: Extract<JourneyState, { step: "await_link" }>,
  event: JourneyEvent,
  now: Date,
) {
  if (event.type === "requested_resend" && canResend(state.resendAvailableAt, now) && state.email) {
    return busy(state, { kind: "send_link", email: state.email, operation: "sign_in" });
  }
  if (event.type === "link_dispatched" && event.operation === "sign_in") {
    return idle(awaitLink(state, event.at, now));
  }
  return idle(state);
}

function reducePassword(state: Extract<JourneyState, { step: "password" }>, event: JourneyEvent) {
  if (event.type === "submitted_password" && event.password) {
    return busy(state, {
      kind: "sign_in_with_password",
      email: state.email,
      password: event.password,
    });
  }
  return idle(state);
}

function reduceCreateProfile(
  state: Extract<JourneyState, { step: "create_profile" }>,
  event: JourneyEvent,
) {
  if (event.type === "name_changed") return idle({ ...state, displayName: event.displayName });
  if (event.type === "submitted_new_profile" && event.password) {
    return busy(state, {
      kind: "create_profile",
      email: state.email,
      password: event.password,
      displayName: event.displayName,
    });
  }
  return idle(state);
}

function reduceRecover(
  state: Extract<JourneyState, { step: "recover" }>,
  event: JourneyEvent,
  now: Date,
) {
  if (event.type === "requested_recovery_link" && state.email) {
    return busy(state, { kind: "send_link", email: state.email, operation: "password_reset" });
  }
  if (event.type === "link_dispatched" && event.operation === "password_reset") {
    return idle(recoverySent(state, event.at, now));
  }
  return idle(state);
}

function reduceRecoverySent(
  state: Extract<JourneyState, { step: "recovery_sent" }>,
  event: JourneyEvent,
  now: Date,
) {
  if (event.type === "requested_resend" && canResend(state.resendAvailableAt, now) && state.email) {
    return busy(state, { kind: "send_link", email: state.email, operation: "password_reset" });
  }
  if (event.type === "link_dispatched" && event.operation === "password_reset") {
    return idle(recoverySent(state, event.at, now));
  }
  return idle(state);
}

function reduceChoosePassword(
  state: Extract<JourneyState, { step: "choose_password" }>,
  event: JourneyEvent,
) {
  if (event.type === "submitted_new_password" && event.password && state.email) {
    return busy(state, {
      kind: "complete_reset",
      grant: state.grant,
      email: state.email,
      password: event.password,
    });
  }
  return idle(state);
}

function awaitLink(
  state: Extract<JourneyState, { email: string }>,
  at: string,
  now: Date,
): Extract<JourneyState, { step: "await_link" }> {
  return {
    step: "await_link",
    operation: "sign_in",
    email: state.email,
    busy: false,
    notice: { kind: "link_sent", operation: "sign_in", email: state.email },
    resendAvailableAt: resendAt(at, now),
  };
}

function recoverySent(
  state: Extract<JourneyState, { email: string }>,
  at: string,
  now: Date,
): Extract<JourneyState, { step: "recovery_sent" }> {
  return {
    step: "recovery_sent",
    email: state.email,
    busy: false,
    notice: { kind: "link_sent", operation: "password_reset", email: state.email },
    resendAvailableAt: resendAt(at, now),
  };
}

function identifyFrom(
  state: Exclude<JourneyState, { step: "established" }>,
): Extract<JourneyState, { step: "identify" }> {
  return initialIdentifyState(state.email);
}

function emailOf(state: JourneyState): string {
  return state.step === "established" ? "" : state.email;
}

function withNotice(
  state: Exclude<JourneyState, { step: "established" }>,
  notice: Notice,
): Exclude<JourneyState, { step: "established" }> {
  return { ...state, busy: false, notice };
}

function canResend(resendAvailableAt: string, now: Date): boolean {
  return now.toISOString() >= resendAvailableAt;
}

function resendAt(at: string, now: Date): string {
  const started = parseISO(at);
  const base = isValid(started) ? started : now;
  return addSeconds(base, RESEND_COOLDOWN_SECONDS).toISOString();
}

function established(user: Identity) {
  return { state: { step: "established" as const, user }, effect: null };
}

function idle(state: JourneyState) {
  return { state, effect: null };
}

function busy(state: Exclude<JourneyState, { step: "established" }>, effect: JourneyEffect) {
  return { state: { ...state, busy: true, notice: null }, effect };
}
