import type { CommandEnvelope, CommandResult } from "@trove/protocol";

import { parseAck, parseEffectTags } from "./ack";

const createEnvelope: CommandEnvelope = {
  commandId: "cmd-1",
  householdId: "household-1",
  kind: "transaction.create",
  payload: {
    id: "txn-1",
    type: "expense",
    amountMinor: 100,
    date: "2026-03-01",
    accountId: "cash",
  },
};

const applied = (transactionId: string, seq = 7): CommandResult => ({
  kind: "applied",
  seq,
  effects: ["ledger"],
  applied: { transactionId },
  replayed: false,
});

describe("parseAck", () => {
  it("promotes an identity-checked transaction apply to confirmed", () => {
    expect(parseAck(createEnvelope, applied("txn-1"))).toEqual({
      kind: "confirmed",
      confirmed: {
        commandId: "cmd-1",
        seq: 7,
        command: createEnvelope,
      },
    });
  });

  it("returns mismatch when applied names a different transaction", () => {
    const outcome = parseAck(createEnvelope, applied("txn-other"));
    expect(outcome.kind).toBe("mismatch");
    if (outcome.kind === "mismatch") {
      expect(outcome.detail).toContain("txn-other");
    }
  });

  it("keeps the command queued on local_only", () => {
    expect(
      parseAck(createEnvelope, { kind: "local_only", reason: "kill_switch_local_only" }),
    ).toEqual({ kind: "still_queued" });
  });

  it("treats typed rejections as rejected and leaves rollback to the outbox", () => {
    expect(
      parseAck(createEnvelope, {
        kind: "stale_version",
        entityId: "txn-1",
        expectedVersion: 1,
        actualVersion: 2,
      }),
    ).toEqual({ kind: "rejected", reason: "stale_version" });
  });

  it("ignores account and category acks in this milestone", () => {
    const accountCreate: CommandEnvelope = {
      commandId: "cmd-acc",
      householdId: "household-1",
      kind: "account.create",
      payload: { id: "acc-1" },
    };
    expect(parseAck(accountCreate, applied("acc-1"))).toEqual({ kind: "still_queued" });
  });
});

describe("parseEffectTags", () => {
  it("keeps known tags and drops unknown ones", () => {
    expect(parseEffectTags(["ledger", "not-a-tag", "balances"])).toEqual(["ledger", "balances"]);
  });
});
