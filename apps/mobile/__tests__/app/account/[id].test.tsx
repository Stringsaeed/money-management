import { fireEvent, render, screen } from "@testing-library/react-native";

import AccountDetailScreen from "@/app/account/[id]";
import { createAccount, createTransactionWithDetails } from "@/tests/test-utils/factories";

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUseAccount = jest.fn();
const mockUseTransactions = jest.fn();
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
          id: "txn-1",
          date: "2026-03-01",
          type: "expense",
          amount: 1200,
        }),
      ],
      isLoading: false,
    });

    await render(<AccountDetailScreen />);

    expect(screen.getByText("Main Checking")).toBeOnTheScreen();
    expect(mockTransactionGroup).toHaveBeenCalled();
  });

  it("navigates back when the header back control is pressed", async () => {
    mockUseAccount.mockReturnValue({
      data: createAccount({ id: "account-1" }),
      isLoading: false,
    });
    mockUseTransactions.mockReturnValue({ data: [], isLoading: false });

    await render(<AccountDetailScreen />);
    fireEvent.press(screen.getByText("← Back"));

    expect(mockBack).toHaveBeenCalled();
  });
});
