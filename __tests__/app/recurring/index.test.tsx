import { fireEvent, render, screen } from "@testing-library/react-native";

import RecurringListScreen from "@/app/recurring/index";
import { createTransactionWithDetails } from "@/tests/test-utils/factories";

const mockPush = jest.fn();
const mockUseTransactions = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (href: unknown) => mockPush(href) },
}));

jest.mock("@/hooks/use-transactions", () => ({
  useTransactions: (filters: unknown) => mockUseTransactions(filters),
}));

jest.mock("@/components/transaction/transaction-row", () => ({
  TransactionRow: ({ transaction }: { transaction: { description: string } }) => {
    const { Text } = require("react-native");

    return <Text>{transaction.description}</Text>;
  },
}));

describe("app/recurring/index", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseTransactions.mockReturnValue({ data: [], isLoading: false });
  });

  it("queries recurring transactions and opens the shared recurring form", async () => {
    await render(<RecurringListScreen />);

    expect(mockUseTransactions).toHaveBeenCalledWith({ isRecurring: true });

    fireEvent.press(screen.getByText("Add Recurring"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/transaction/[id]",
      params: { id: "new", recurring: "true" },
    });
  });

  it("renders transactions returned by the recurring query", async () => {
    mockUseTransactions.mockReturnValue({
      data: [createTransactionWithDetails({ description: "Internet", isRecurring: true })],
      isLoading: false,
    });

    await render(<RecurringListScreen />);

    expect(screen.getByText("Internet")).toBeOnTheScreen();
  });
});
