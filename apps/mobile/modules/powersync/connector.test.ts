import type { CommandEnvelope, CommandResult } from "@trove/protocol";

import { processPowerSyncUpload, type PowerSyncUploadDatabase } from "./connector";
import { serializeCommandMetadata } from "./command-metadata";

const envelope = (commandId = "command-1"): CommandEnvelope => ({
  commandId,
  householdId: "household-1",
  kind: "transaction.create",
  issuedAt: "2026-09-07T12:00:00.000Z",
  payload: { id: "transaction-1", amountMinor: 500 },
});

const entry = (command: CommandEnvelope, id = "transaction-1") => ({
  id,
  metadata: serializeCommandMetadata(command),
  table: "transactions",
});

const createHarness = (crud = [entry(envelope())]) => {
  const complete = jest.fn(async () => undefined);
  const execute = jest.fn(async () => ({ rowsAffected: 1 }));
  const database: PowerSyncUploadDatabase = {
    execute,
    getNextCrudTransaction: jest.fn(async () => ({ complete, crud })),
  };
  const apply = jest.fn<Promise<CommandResult>, [CommandEnvelope]>();
  const disconnect = jest.fn(async () => undefined);
  const setLocalOnly = jest.fn();
  return { apply, complete, database, disconnect, execute, setLocalOnly };
};

describe("PowerSync connector uploadData", () => {
  it.each([false, true])(
    "completes applied and replayed commands (replayed=%s)",
    async (replayed) => {
      const command = envelope();
      const harness = createHarness([entry(command), entry(command, "transaction-2")]);
      harness.apply.mockResolvedValue({
        kind: "applied",
        seq: 1,
        effects: ["ledger"],
        applied: {},
        replayed,
      });

      await processPowerSyncUpload(harness.database, harness);

      expect(harness.apply).toHaveBeenCalledTimes(1);
      expect(harness.apply).toHaveBeenCalledWith(command);
      expect(harness.complete).toHaveBeenCalledTimes(1);
      expect(harness.execute).not.toHaveBeenCalled();
    },
  );

  it("stores a typed rejection, completes the CRUD transaction, and lets PowerSync roll back", async () => {
    const harness = createHarness();
    harness.apply.mockResolvedValue({
      kind: "stale_version",
      entityId: "transaction-1",
      expectedVersion: 1,
      actualVersion: 2,
    });

    await processPowerSyncUpload(harness.database, harness);

    expect(harness.execute).toHaveBeenCalledWith(
      expect.stringContaining("rejected_changes"),
      expect.arrayContaining(["command-1", "household-1", "stale_version"]),
    );
    expect(harness.complete).toHaveBeenCalledTimes(1);
  });

  it("disconnects and leaves the batch queued when the server engages local-only mode", async () => {
    const harness = createHarness();
    harness.apply.mockResolvedValue({ kind: "local_only", reason: "kill_switch_local_only" });

    await expect(processPowerSyncUpload(harness.database, harness)).rejects.toThrow(
      "PowerSync upload paused by the remote kill switch.",
    );

    expect(harness.disconnect).toHaveBeenCalledTimes(1);
    expect(harness.setLocalOnly).toHaveBeenCalledWith("kill_switch");
    expect(harness.complete).not.toHaveBeenCalled();
  });

  it("leaves the batch queued when commands.apply has a network error", async () => {
    const harness = createHarness();
    harness.apply.mockRejectedValue(new Error("offline"));

    await expect(processPowerSyncUpload(harness.database, harness)).rejects.toThrow("offline");
    expect(harness.complete).not.toHaveBeenCalled();
    expect(harness.execute).not.toHaveBeenCalled();
  });

  it("moves entries without a parsed envelope to rejected_changes", async () => {
    const harness = createHarness([
      { id: "transaction-bad", metadata: "not-json", table: "transactions" },
    ]);

    await processPowerSyncUpload(harness.database, harness);

    expect(harness.apply).not.toHaveBeenCalled();
    expect(harness.execute).toHaveBeenCalledWith(
      expect.stringContaining("rejected_changes"),
      expect.arrayContaining(["invalid-metadata:transaction-bad", "invalid_intent"]),
    );
    expect(harness.complete).toHaveBeenCalledTimes(1);
  });

  it("rejects a command id reused with conflicting envelopes without applying either", async () => {
    const first = envelope();
    const second = { ...first, payload: { id: "transaction-2", amountMinor: 900 } };
    const harness = createHarness([entry(first), entry(second, "transaction-2")]);

    await processPowerSyncUpload(harness.database, harness);

    expect(harness.apply).not.toHaveBeenCalled();
    expect(harness.execute).toHaveBeenCalledWith(
      expect.stringContaining("rejected_changes"),
      expect.arrayContaining(["command-1", "invalid_intent"]),
    );
    expect(harness.complete).toHaveBeenCalledTimes(1);
  });
});
