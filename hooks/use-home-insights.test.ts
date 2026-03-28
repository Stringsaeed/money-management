import { renderHook } from "@testing-library/react-native";

import {
  createAccountWithBalance,
  createDayGroup,
  createTransactionWithDetails,
} from "@/tests/test-utils/factories";
import { useHomeInsights } from "@/hooks/use-home-insights";

describe("useHomeInsights", () => {
  it("returns total account balance when no filters are active", () => {
    const { result } = renderHook(() =>
      useHomeInsights({
        accounts: [
          createAccountWithBalance({ id: "account-1", balance: 100_00 }),
          createAccountWithBalance({ id: "account-2", balance: 50_00 }),
        ],
        groups: [
          createDayGroup({
            transactions: [createTransactionWithDetails({ type: "expense", amount: 20_00 })],
            totalExpense: 20_00,
          }),
        ],
        activeFilterCount: 0,
      }),
    );

    expect(result.current.filteredBalance).toBe(150_00);
    expect(result.current.flatTransactions).toHaveLength(1);
  });

  it("returns filtered net balance when filters are active", () => {
    const { result } = renderHook(() =>
      useHomeInsights({
        accounts: [createAccountWithBalance({ balance: 999_00 })],
        groups: [
          createDayGroup({
            transactions: [
              createTransactionWithDetails({ id: "transaction-1", type: "income", amount: 80_00 }),
              createTransactionWithDetails({ id: "transaction-2", type: "expense", amount: 30_00 }),
              createTransactionWithDetails({
                id: "transaction-3",
                type: "transfer",
                amount: 20_00,
              }),
            ],
            totalIncome: 80_00,
            totalExpense: 30_00,
          }),
        ],
        activeFilterCount: 1,
      }),
    );

    expect(result.current.filteredBalance).toBe(50_00);
    expect(result.current.categorySpending).toEqual([
      {
        category: "Groceries",
        amount: 30_00,
        color: "#B48A7B",
        icon: "🛒",
      },
    ]);
    expect(result.current.monthlyTrend).toEqual([
      {
        month: 0,
        label: "Mar",
        income: 80,
        expense: 30,
      },
    ]);
  });
});
