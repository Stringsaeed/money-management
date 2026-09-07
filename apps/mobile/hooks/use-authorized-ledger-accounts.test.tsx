import { waitFor } from "@testing-library/react-native";

import { useAuthorizedLedgerAccounts } from "@/hooks/use-authorized-ledger-accounts";
import { useSyncModeStore } from "@/stores/sync-mode-store";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const mockListAccounts = jest.fn();

jest.mock("@/lib/server/orpc", () => ({
  orpc: {
    ledger: {
      accounts: { list: (...args: unknown[]) => mockListAccounts(...args) },
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  useSyncModeStore.setState({ mode: "synced", reason: null });
});

it("fails closed without calling oRPC while sync is local-only", async () => {
  useSyncModeStore.setState({ mode: "local_only", reason: "powersync_unavailable" });

  const { result } = await renderHookWithProviders(() =>
    useAuthorizedLedgerAccounts("household-1"),
  );

  await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
  expect(result.current.data).toBeUndefined();
  expect(mockListAccounts).not.toHaveBeenCalled();
});
