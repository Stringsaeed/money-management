import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import type { V2Account, V2Category } from "@trove/api/v2/contracts";

import { rawColorValues } from "@/ui/design-tokens";

import { TransactionForm } from "../transaction-form";

const stamp = {
  version: 1,
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
};
const account = (id: string, name: string): V2Account => ({
  ...stamp,
  id,
  name,
  ledgerId: "personal:guest-1",
  type: "checking",
  currency: "USD",
  openingBalanceMinor: 0,
  balanceMinor: 0,
  archived: false,
});
const food: V2Category = {
  ...stamp,
  id: "category-1",
  ledgerId: "personal:guest-1",
  name: "Food",
  kind: "expense",
  color: "#4a8f69",
  icon: "🍜",
  parentId: null,
  sortOrder: 0,
  archived: false,
};
const salary: V2Category = {
  ...food,
  id: "category-2",
  name: "Salary",
  kind: "income",
  icon: "💼",
};
const accounts = [account("account-1", "Checking"), account("account-2", "Savings")];

const press = (label: string) => fireEvent.press(screen.getByRole("button", { name: label }));

describe("TransactionForm", () => {
  it("builds the amount on the keypad and submits an expense", async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    await render(<TransactionForm accounts={accounts} categories={[food]} onSubmit={onSubmit} />);

    for (const key of ["1", "2", "Decimal point", "5"]) await press(key);
    await press("Category: none");
    await press("Food");
    await fireEvent.changeText(screen.getByLabelText("Note"), "  Lunch ");
    await press("Save");

    expect(onSubmit).toHaveBeenCalledWith({
      accountId: "account-1",
      categoryId: "category-1",
      toAccountId: null,
      kind: "expense",
      amountMinor: 1250,
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      note: "Lunch",
    });
  });

  it("blocks saving a zero amount with an actionable message", async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    await render(<TransactionForm accounts={accounts} categories={[food]} onSubmit={onSubmit} />);

    await press("Save");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter an amount above zero to save this expense.",
    );
  });

  it("requires a destination account for transfers", async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    await render(<TransactionForm accounts={accounts} categories={[food]} onSubmit={onSubmit} />);

    await press("Category: none");
    await press("Transfer");
    await press("5");
    await press("Save");
    expect(onSubmit).not.toHaveBeenCalled();

    await press("To account: not selected");
    await press("Savings");
    await press("Save");
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "transfer",
        toAccountId: "account-2",
        categoryId: null,
        amountMinor: 500,
      }),
    );
  });

  it("takes the transaction type from the chosen category", async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    await render(
      <TransactionForm accounts={accounts} categories={[food, salary]} onSubmit={onSubmit} />,
    );

    await press("9");
    await press("Category: none");
    await press("Salary");
    await press("Save");

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "income", categoryId: "category-2", amountMinor: 900 }),
    );
  });

  it("sends the user to create an account when there are none to pick", async () => {
    const onCreateAccount = jest.fn();
    await render(
      <TransactionForm
        accounts={[]}
        categories={[food]}
        onSubmit={jest.fn(() => Promise.resolve())}
        onCreateAccount={onCreateAccount}
      />,
    );

    await press("Account: not selected");
    expect(screen.getByText("No accounts to pick")).toBeOnTheScreen();
    await press("Add account");

    await waitFor(() => expect(onCreateAccount).toHaveBeenCalledTimes(1));
  });

  it("sends the user to create a category when there are none to pick", async () => {
    const onCreateCategory = jest.fn();
    await render(
      <TransactionForm
        accounts={accounts}
        categories={[]}
        onSubmit={jest.fn(() => Promise.resolve())}
        onCreateCategory={onCreateCategory}
      />,
    );

    await press("Category: none");
    expect(screen.getByText("No categories yet")).toBeOnTheScreen();
    await press("Add category");

    await waitFor(() => expect(onCreateCategory).toHaveBeenCalledTimes(1));
  });

  it("shows no currency until an account provides one", async () => {
    await render(
      <TransactionForm accounts={[]} categories={[]} onSubmit={jest.fn(() => Promise.resolve())} />,
    );

    expect(screen.getByTestId("transaction-amount")).toHaveTextContent("0.00", { exact: true });
  });

  it("takes the currency from the selected account", async () => {
    const euros = { ...account("account-3", "Euro wallet"), currency: "EUR" };
    await render(
      <TransactionForm
        accounts={[euros]}
        categories={[]}
        onSubmit={jest.fn(() => Promise.resolve())}
      />,
    );

    expect(screen.getByTestId("transaction-amount")).toHaveTextContent("€0.00", { exact: true });
  });

  it("renders the riyal glyph for a SAR account", async () => {
    const riyals = { ...account("account-4", "Riyal wallet"), currency: "SAR" };
    await render(
      <TransactionForm
        accounts={[riyals]}
        categories={[]}
        onSubmit={jest.fn(() => Promise.resolve())}
      />,
    );

    expect(screen.getByTestId("nano-icon-riyal")).toBeOnTheScreen();
    expect(screen.getByTestId("transaction-amount")).not.toHaveTextContent(/﷼/);
    expect(screen.getByLabelText("Amount 0 SAR")).toBeOnTheScreen();
  });

  it("tints the currency symbol like the digits once an amount is entered", async () => {
    await render(
      <TransactionForm
        accounts={[account("account-1", "Checking")]}
        categories={[]}
        onSubmit={jest.fn(() => Promise.resolve())}
      />,
    );

    expect(screen.getByText("$")).toHaveStyle({ color: rawColorValues.light.mutedForeground });
    await press("5");
    expect(screen.getByText("$")).toHaveStyle({ color: rawColorValues.light.ink });
  });
});
