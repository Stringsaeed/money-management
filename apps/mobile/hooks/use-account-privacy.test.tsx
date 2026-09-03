import { act, waitFor } from "@testing-library/react-native";

import { useAccountPrivacyState, useSetAccountPrivacy } from "@/hooks/use-account-privacy";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockRead = jest.fn();
const mockSet = jest.fn();

jest.mock("@/modules/ledger-data-source/coordinator", () => ({
  useAccountDataSource: () => ({
    source: "synced",
    cacheKey: "synced:household-1:user-1",
    accountPrivacy: {
      kind: "synced",
      read: (...args: unknown[]) => mockRead(...args),
      set: (...args: unknown[]) => mockSet(...args),
    },
  }),
}));

jest.mock("@/modules/ledger-cache", () => ({
  ...jest.requireActual("@/modules/ledger-cache"),
  cohereLedgerCache: jest.fn().mockResolvedValue(undefined),
}));

describe("account privacy hooks", () => {
  beforeEach(() => {
    mockRead.mockResolvedValue({ visibility: "public", isOwner: true });
    mockSet.mockResolvedValue(undefined);
  });

  it("reads privacy from the data source and never applies live", async () => {
    const { result } = await renderHookWithProviders(() => useAccountPrivacyState("account-1"));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ visibility: "public", isOwner: true });
    expect(mockRead).toHaveBeenCalledWith("account-1");
  });

  it("enqueues visibility through accountPrivacy.set", async () => {
    const { result } = await renderHookWithProviders(() => useSetAccountPrivacy("account-1"));

    await act(async () => {
      await result.current.mutateAsync(true);
    });

    expect(mockSet).toHaveBeenCalledWith("account-1", "private");
  });

  it("keeps the pending privacy variable until the mutation settles", async () => {
    let resolveSet!: () => void;
    mockSet.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSet = resolve;
        }),
    );
    const { result } = await renderHookWithProviders(() => useSetAccountPrivacy("account-1"));

    await act(async () => {
      result.current.mutate(true);
    });

    await waitFor(() => {
      expect(result.current.variables).toBe(true);
    });

    await act(async () => {
      resolveSet();
    });
  });
});
