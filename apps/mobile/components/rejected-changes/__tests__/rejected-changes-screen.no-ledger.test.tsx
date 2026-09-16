import { render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

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


const initialWindowMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return <SafeAreaProvider initialMetrics={initialWindowMetrics}>{children}</SafeAreaProvider>;
}

describe("RejectedChangesScreen without SyncedTransactionsProvider", () => {
  // Regression for #193: the Inbox tab is reachable while the ledger source
  // is local-only, anonymous, resolving, or mid-migration — i.e. before
  // SyncedTransactionsProvider ever mounts. It must render an empty inbox
  // instead of crashing the app.
  it("renders the empty state instead of throwing", async () => {
    mockLedger.current = null;

    await render(<RejectedChangesScreen />, { wrapper: Wrapper });

    expect(screen.getByText(/Rejected Changes/)).toBeOnTheScreen();
    expect(await screen.findByText("Nothing rejected")).toBeOnTheScreen();
  });
});
