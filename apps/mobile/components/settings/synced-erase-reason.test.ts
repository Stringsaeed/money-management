import { describe, expect, it } from "@jest/globals";

jest.mock("@tanstack/react-query", () => ({ useQueryClient: jest.fn() }));
jest.mock("@/db/client", () => ({ useDatabase: jest.fn() }));
jest.mock("@/db/schema", () => ({
  accounts: {},
  categories: {},
  exchangeRates: {},
  recurringOccurrences: {},
  recurringRules: {},
  transactions: {},
}));
jest.mock("@/db/seed", () => ({ clearSeedVersion: jest.fn() }));
jest.mock("@/modules/ledger-cache", () => ({ cohereLedgerCache: jest.fn() }));
jest.mock("@/modules/ledger-data-source/provider", () => ({
  useLedgerSourceSelection: jest.fn(),
}));

import { SYNCED_ERASE_REASON } from "./use-erase-local-data";

describe("SYNCED_ERASE_REASON", () => {
  it("locks the synced-device erase unavailable reason string", () => {
    expect(SYNCED_ERASE_REASON).toBe(
      "This device is synced to your household; the ledger lives on the server. Disable sync to erase local data.",
    );
  });
});
