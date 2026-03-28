import { fireEvent, render, screen } from "@testing-library/react-native";

import { TransactionRow } from "@/components/transaction/transaction-row";
import { createTransactionWithDetails } from "@/tests/test-utils/factories";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

jest.mock("expo-symbols", () => ({
  SymbolView: () => null,
}));

describe("TransactionRow", () => {
  it("renders transaction details and routes to edit", () => {
    render(
      <TransactionRow
        transaction={createTransactionWithDetails({
          id: "transaction-1",
          description: "Coffee",
          amount: 10_00,
        })}
        showAccount
      />,
    );

    fireEvent.press(screen.getByText("Coffee"));

    expect(screen.getByText("Groceries · Main Checking")).toBeOnTheScreen();
    expect(screen.getByText("-$10.00")).toBeOnTheScreen();
    expect(mockPush).toHaveBeenCalledWith("/transaction/transaction-1");
  });
});
