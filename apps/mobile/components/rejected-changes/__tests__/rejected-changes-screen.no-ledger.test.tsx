import { render, screen } from "@testing-library/react-native";

import { RejectedChangesScreen } from "@/components/rejected-changes/rejected-changes-screen";

const mockLedger: { current: unknown } = { current: null };

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

jest.mock("@/modules/ledger-db/provider", () => ({
  useSyncedTransactionLedger: () => mockLedger.current,
}));

jest.mock("@/hooks/use-households", () => ({
  useActiveHousehold: () => ({ activeHousehold: null }),
}));

describe("RejectedChangesScreen without SyncedTransactionsProvider", () => {
  // Regression for #193: the Inbox tab is reachable while the ledger source
  // is local-only, anonymous, resolving, or mid-migration — i.e. before
  // SyncedTransactionsProvider ever mounts. It must render an empty inbox
  // instead of crashing the app.
  it("renders the empty state instead of throwing", async () => {
    mockLedger.current = null;

    await render(<RejectedChangesScreen />);

    expect(screen.getByText(/Rejected Changes/)).toBeOnTheScreen();
    expect(await screen.findByText("Nothing rejected")).toBeOnTheScreen();
  });
});
