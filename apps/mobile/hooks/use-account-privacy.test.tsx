import { act, waitFor } from "@testing-library/react-native";

import { useAccountPrivacy } from "@/hooks/use-account-privacy";
import type { AuthorizedLedgerAccount } from "@/hooks/use-authorized-ledger-accounts";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockUpdate = jest.fn();
const mockApply = jest.fn();

jest.mock("@/modules/ledger-data-source/coordinator", () => ({
  useAccountDataSource: () => ({
    source: "synced",
    cacheKey: "synced:household-1:user-1",
    accounts: { update: (...args: unknown[]) => mockUpdate(...args) },
  }),
}));

jest.mock("@/lib/server/orpc", () => ({
  orpc: {
    commands: { apply: (...args: unknown[]) => mockApply(...args) },
  },
}));

jest.mock("@/modules/ledger-cache", () => ({
  ...jest.requireActual("@/modules/ledger-cache"),
  cohereLedgerCache: jest.fn().mockResolvedValue(undefined),
}));

const ownerAccount = {
  id: "account-1",
  ownerUserId: "user-1",
  visibility: "public",
  version: 4,
} as AuthorizedLedgerAccount;

describe("useAccountPrivacy", () => {
  beforeEach(() => {
    mockUpdate.mockResolvedValue(undefined);
  });

  it("enqueues visibility through the Account resource and never applies live", async () => {
    const { result } = await renderHookWithProviders(() =>
      useAccountPrivacy(ownerAccount, "household-1"),
    );

    await act(async () => {
      await result.current.mutateAsync(true);
    });

    expect(mockUpdate).toHaveBeenCalledWith("account-1", { visibility: "private" });
    expect(mockApply).not.toHaveBeenCalled();
  });

  it("rejects a missing household instead of inventing an apply", async () => {
    const { result } = await renderHookWithProviders(() => useAccountPrivacy(ownerAccount, null));

    await act(async () => {
      await expect(result.current.mutateAsync(true)).rejects.toThrow(
        "not available in the active household",
      );
    });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockApply).not.toHaveBeenCalled();
  });

  it("keeps the pending privacy variable until the mutation settles", async () => {
    let resolveUpdate!: () => void;
    mockUpdate.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve;
        }),
    );
    const { result } = await renderHookWithProviders(() =>
      useAccountPrivacy(ownerAccount, "household-1"),
    );

    await act(async () => {
      result.current.mutate(true);
    });

    await waitFor(() => {
      expect(result.current.variables).toBe(true);
    });

    await act(async () => {
      resolveUpdate();
    });
  });
});
