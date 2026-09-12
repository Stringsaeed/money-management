import { COMMAND_KINDS, type CommandEnvelope } from "@trove/protocol";

import {
  commandMetadataFor,
  parseCommandMetadata,
  serializeCommandMetadata,
} from "./command-metadata";

describe("commandMetadataFor", () => {
  it("wraps the envelope with storageVersion 1 and matching commandId", () => {
    const envelope: CommandEnvelope = {
      commandId: "cmd-1",
      householdId: "household-1",
      kind: "transaction.create",
      issuedAt: "2026-09-12T00:00:00.000Z",
      payload: { amountMinor: 100 },
    };

    expect(commandMetadataFor(envelope)).toEqual({
      storageVersion: 1,
      commandId: "cmd-1",
      envelope,
    });
  });

  it("preserves personal and organization scopes on the nested envelope", () => {
    const personal: CommandEnvelope = {
      commandId: "cmd-personal",
      scope: { type: "personal" },
      kind: "budget.configure",
      issuedAt: "2026-09-12T00:00:00.000Z",
      payload: { action: "workspace.activate" },
    };
    const organization: CommandEnvelope = {
      commandId: "cmd-org",
      scope: { type: "organization", organizationId: "org-9" },
      kind: "transaction.create",
      issuedAt: "2026-09-12T00:00:00.000Z",
      payload: { amountMinor: 50 },
    };

    expect(commandMetadataFor(personal).envelope).toEqual(personal);
    expect(commandMetadataFor(organization).envelope.scope).toEqual({
      type: "organization",
      organizationId: "org-9",
    });
    expect(commandMetadataFor(organization).commandId).toBe("cmd-org");
  });

  it("keeps commandId aligned with envelope.commandId for JSON round-trips", () => {
    const envelope: CommandEnvelope = {
      commandId: "cmd-roundtrip",
      householdId: "household-2",
      kind: "transaction.create",
      issuedAt: "2026-09-12T00:00:00.000Z",
      payload: { amountMinor: 25 },
    };
    const metadata = commandMetadataFor(envelope);
    expect(metadata.commandId).toBe(metadata.envelope.commandId);
    expect(parseCommandMetadata(JSON.stringify(metadata))).toEqual(envelope);
  });
});

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
