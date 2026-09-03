import { describe, expect, it } from "@jest/globals";

import {
  initialChoosePasswordState,
  initialIdentifyState,
  reduce,
  RESEND_COOLDOWN_SECONDS,
} from "./journey";
import type { JourneyEvent, JourneyState } from "./types";

const now = new Date("2026-04-01T12:00:00.000Z");
const user = { userId: "u1", email: "ada@trove.ing", displayName: "Ada" };

function apply(state: JourneyState, event: JourneyEvent, at = now) {
  return reduce(state, event, at);
}

describe("auth journey reducer", () => {
  it("keeps create profile reachable from identify", () => {
    const identified = apply(initialIdentifyState(), {
      type: "email_changed",
      email: "ada@trove.ing",
    }).state;
    expect(identified).toMatchObject({ step: "identify", email: "ada@trove.ing" });
    expect(apply(identified, { type: "chose_create_profile" }).state).toMatchObject({
      step: "create_profile",
      email: "ada@trove.ing",
    });
  });

  it("sends a generic sign-in link and starts the resend cooldown", () => {
    const identified = apply(initialIdentifyState("ada@trove.ing"), {
      type: "requested_sign_in_link",
    });
    expect(identified.effect).toEqual({
      kind: "send_link",
      email: "ada@trove.ing",
      operation: "sign_in",
    });
    const waiting = apply(identified.state, {
      type: "link_dispatched",
      operation: "sign_in",
      at: now.toISOString(),
    }).state;
    expect(waiting).toMatchObject({
      step: "await_link",
      notice: { kind: "link_sent", operation: "sign_in", email: "ada@trove.ing" },
    });
    expect(apply(waiting, { type: "requested_resend" }).effect).toBeNull();
    const later = new Date(now.getTime() + (RESEND_COOLDOWN_SECONDS + 1) * 1000);
    expect(apply(waiting, { type: "requested_resend" }, later).effect).toEqual({
      kind: "send_link",
      email: "ada@trove.ing",
      operation: "sign_in",
    });
  });

  it("falls back to password sign-in without losing the email", () => {
    const password = apply(initialIdentifyState("ada@trove.ing"), { type: "chose_password" }).state;
    expect(password).toMatchObject({ step: "password", email: "ada@trove.ing" });
    expect(apply(password, { type: "submitted_password", password: "secret12" }).effect).toEqual({
      kind: "sign_in_with_password",
      email: "ada@trove.ing",
      password: "secret12",
    });
  });

  it("sends a generic recovery link", () => {
    const recover = apply(initialIdentifyState("ada@trove.ing"), { type: "chose_recovery" }).state;
    const sent = apply(recover, { type: "requested_recovery_link" });
    expect(sent.effect).toEqual({
      kind: "send_link",
      email: "ada@trove.ing",
      operation: "password_reset",
    });
    expect(
      apply(sent.state, {
        type: "link_dispatched",
        operation: "password_reset",
        at: now.toISOString(),
      }).state,
    ).toMatchObject({
      step: "recovery_sent",
      notice: { kind: "link_sent", operation: "password_reset" },
    });
  });

  it("completes recovery with email, token, and password", () => {
    const choose = initialChoosePasswordState({ token: "reset-1" }, "ada@trove.ing");
    expect(
      apply(choose, { type: "submitted_new_password", password: "new-secret" }).effect,
    ).toEqual({
      kind: "complete_reset",
      grant: { token: "reset-1" },
      email: "ada@trove.ing",
      password: "new-secret",
    });
  });

  it("never grows an existence-revealing notice", () => {
    const notices = [
      apply(initialIdentifyState("ada@trove.ing"), {
        type: "link_dispatched",
        operation: "sign_in",
        at: now.toISOString(),
      }).state,
      apply(initialIdentifyState("unknown@trove.ing"), {
        type: "link_dispatched",
        operation: "sign_in",
        at: now.toISOString(),
      }).state,
    ].map((state) => ("notice" in state ? state.notice : null));
    expect(notices[0]?.kind).toBe("link_sent");
    expect(notices[1]?.kind).toBe("link_sent");
    expect(notices[0]?.kind).toBe(notices[1]?.kind);
  });

  it("maps failures to a closed problem notice", () => {
    const failed = apply(initialIdentifyState("ada@trove.ing"), {
      type: "attempt_failed",
      failure: { kind: "offline" },
    }).state;
    expect(failed).toMatchObject({
      busy: false,
      notice: { kind: "problem", failure: { kind: "offline" } },
    });
  });

  it("establishes a session from any step", () => {
    expect(
      apply(initialIdentifyState("ada@trove.ing"), {
        type: "session_established",
        user,
      }).state,
    ).toEqual({ step: "established", user });
  });
});
