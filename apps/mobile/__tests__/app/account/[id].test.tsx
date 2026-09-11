import { fireEvent, render, screen } from "@testing-library/react-native";

import AccountDetailScreen from "@/app/account/[id]";
import { createAccount, createTransactionWithDetails } from "@/tests/test-utils/factories";

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUseAccount = jest.fn();
const mockUseTransactions = jest.fn();
const mockUseLedgerAccounts = jest.fn();
const mockUseActiveHousehold = jest.fn();
const mockUseAccountPrivacy = jest.fn();
const mockUseAccess = jest.fn();
const mockSetSelectedMonth = jest.fn();
const mockTransactionGroup = jest.fn((_: unknown) => null);

jest.mock("expo-router", () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
    push: (...args: unknown[]) => mockPush(...args),
  },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("@/hooks/use-accounts", () => ({
  useAccount: (...args: unknown[]) => mockUseAccount(...args),
}));

jest.mock("@/hooks/use-transactions", () => ({
  useTransactions: (...args: unknown[]) => mockUseTransactions(...args),
}));

jest.mock("@/hooks/use-authorized-ledger-accounts", () => ({
  useAuthorizedLedgerAccounts: (...args: unknown[]) => mockUseLedgerAccounts(...args),
}));

jest.mock("@/hooks/use-households", () => ({
  useActiveHousehold: () => mockUseActiveHousehold(),
}));

jest.mock("@/hooks/use-account-privacy", () => ({
  useAccountPrivacy: (...args: unknown[]) => mockUseAccountPrivacy(...args),
}));

jest.mock("@/modules/access", () => ({
  useAccess: () => mockUseAccess(),
  signedInUserId: (access: { kind: string; user?: { userId: string } }) =>
    access.kind === "signed_in" ? (access.user?.userId ?? null) : null,
}));

jest.mock("@/stores/ui-store", () => ({
  useUIStore: () => ({
    selectedYear: 2026,
    selectedMonth: 3,
    setSelectedMonth: (...args: unknown[]) => mockSetSelectedMonth(...args),
  }),
}));

jest.mock("@/components/transaction/transaction-group", () => ({
  TransactionGroup: (props: unknown) => mockTransactionGroup(props),
}));

describe("app/account/[id]", () => {
  beforeEach(() => {
    mockUseLocalSearchParams.mockReturnValue({ id: "account-1" });
    mockUseAccess.mockReturnValue({
      kind: "signed_in",
      user: { userId: "user-owner", email: "ada@trove.ing", displayName: "Ada" },
      household: { kind: "none" },
      memberships: [],
      selection: { kind: "personal" },
      setActiveHousehold: jest.fn(),
      signOut: jest.fn(),
    });
    mockUseActiveHousehold.mockReturnValue({ activeHousehold: null });
    mockUseLedgerAccounts.mockReturnValue({ data: [] });
    mockUseAccountPrivacy.mockReturnValue({ error: null, isPending: false, mutate: jest.fn() });
  });

  it("shows the privacy control only for the server account owner", async () => {
    mockUseAccount.mockReturnValue({
      data: createAccount({ id: "account-1" }),
      isLoading: false,
    });
    mockUseTransactions.mockReturnValue({ data: [], isLoading: false });
    mockUseActiveHousehold.mockReturnValue({
      activeHousehold: { householdId: "household-1" },
    });
    mockUseLedgerAccounts.mockReturnValue({
      data: [{ id: "account-1", ownerUserId: "user-owner", visibility: "public" }],
    });

    await render(<AccountDetailScreen />);

    expect(screen.getByRole("switch", { name: "Private account" })).toBeOnTheScreen();
    expect(screen.getByRole("switch", { name: "Private account" })).not.toBeChecked();
  });

  it("prefers in-flight privacy variables over the authorized list", async () => {
    mockUseAccount.mockReturnValue({
      data: createAccount({ id: "account-1" }),
      isLoading: false,
    });
    mockUseTransactions.mockReturnValue({ data: [], isLoading: false });
    mockUseActiveHousehold.mockReturnValue({
      activeHousehold: { householdId: "household-1" },
    });
    mockUseLedgerAccounts.mockReturnValue({
      data: [{ id: "account-1", ownerUserId: "user-owner", visibility: "public" }],
    });
    mockUseAccountPrivacy.mockReturnValue({
      error: null,
      isPending: true,
      mutate: jest.fn(),
      variables: true,
    });

    await render(<AccountDetailScreen />);

    expect(screen.getByRole("switch", { name: "Private account" })).toBeChecked();
  });

  it("renders account details, month navigation, and grouped transactions", async () => {
    mockUseAccount.mockReturnValue({
      data: createAccount({
        id: "account-1",
        name: "Main Checking",
        currency: "USD",
        color: "#8B9D83",
      }),
      isLoading: false,
    });
    mockUseTransactions.mockReturnValue({
      data: [
        createTransactionWithDetails({
          id: "transaction-1",
          type: "income",
          amount: 500_00,
          date: "2026-03-28",
        }),
        createTransactionWithDetails({
          id: "transaction-2",
          type: "expense",
          amount: 125_00,
          date: "2026-03-28",
        }),
      ],
      isLoading: false,
    });

    await render(<AccountDetailScreen />);

    expect(screen.getByText("Main Checking")).toBeOnTheScreen();
    expect(screen.getByText("+$500.00")).toBeOnTheScreen();
    expect(screen.getByText("-$125.00")).toBeOnTheScreen();
    expect(mockTransactionGroup).toHaveBeenCalled();

    await fireEvent.press(screen.getByText("← Back"));
    await fireEvent.press(screen.getByText("‹"));
    await fireEvent.press(screen.getByText("›"));
    await fireEvent.press(screen.getByText("+"));

    expect(mockBack).toHaveBeenCalled();
    expect(mockSetSelectedMonth).toHaveBeenNthCalledWith(1, 2026, 2);
    expect(mockSetSelectedMonth).toHaveBeenNthCalledWith(2, 2026, 4);
    expect(mockPush).toHaveBeenCalledWith("/transaction/new");
  });

  it("shows loading and empty states", async () => {
    mockUseAccount.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    mockUseTransactions.mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { rerender } = await render(<AccountDetailScreen />);

    expect(screen.queryByText("No transactions this month")).not.toBeOnTheScreen();

    mockUseAccount.mockReturnValue({
      data: createAccount({ id: "account-1" }),
      isLoading: false,
    });
    mockUseTransactions.mockReturnValue({
      data: [],
      isLoading: false,
    });

    await rerender(<AccountDetailScreen />);

    expect(screen.getByText("No transactions this month")).toBeOnTheScreen();
  });
});
