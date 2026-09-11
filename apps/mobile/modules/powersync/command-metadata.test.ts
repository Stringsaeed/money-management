import { COMMAND_KINDS, type CommandEnvelope } from "@trove/protocol";

import { parseCommandMetadata, serializeCommandMetadata } from "./command-metadata";

describe("PowerSync command metadata", () => {
  it.each(COMMAND_KINDS)("round-trips the full %s envelope", (kind) => {
    const envelope: CommandEnvelope = {
      commandId: `command-${kind}`,
      householdId: "household-1",
      kind,
      issuedAt: "2026-09-07T12:00:00.000Z",
      payload: { value: kind },
      preconditions: [{ entityId: "entity-1", expectedVersion: 2 }],
    };

    expect(parseCommandMetadata(serializeCommandMetadata(envelope))).toEqual(envelope);
  });

  it("round-trips a personal-scope envelope without a Household", () => {
    const envelope: CommandEnvelope = {
      commandId: "command-personal",
      scope: { type: "personal" },
      kind: "budget.configure",
      issuedAt: "2026-09-07T12:00:00.000Z",
      payload: { action: "workspace.activate" },
    };

    expect(parseCommandMetadata(serializeCommandMetadata(envelope))).toEqual(envelope);
  });

  it("rejects malformed JSON and mismatched command ids", () => {
    expect(parseCommandMetadata("not-json")).toBeNull();
    expect(
      parseCommandMetadata(
        JSON.stringify({
          storageVersion: 1,
          commandId: "outer",
          envelope: {
            commandId: "inner",
            householdId: "household-1",
            kind: "transaction.create",
            payload: {},
          },
        }),
      ),
    ).toBeNull();
  });
});
