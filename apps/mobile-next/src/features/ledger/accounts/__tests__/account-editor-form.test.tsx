import { fireEvent, render, screen } from "@testing-library/react-native";

import type { V2Account } from "@trove/api/v2/contracts";

import { AccountEditorForm } from "../account-editor-form";

const card: V2Account = {
  id: "account-1",
  ledgerId: "personal:guest-1",
  name: "Travel card",
  type: "credit_card",
  currency: "EUR",
  openingBalanceMinor: -12050,
  balanceMinor: -12050,
  archived: false,
  version: 3,
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
};

const press = (label: string) => fireEvent.press(screen.getByRole("button", { name: label }));

describe("AccountEditorForm", () => {
  it("creates an account from the keypad, type, and currency pickers", async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    await render(<AccountEditorForm defaultCurrency="USD" onSubmit={onSubmit} />);

    await press("Account type: Checking");
    await press("Savings");
    await press("Currency: USD");
    await press("UAE dirham (AED)");
    for (const key of ["2", "5", "0", "Decimal point", "7", "5"]) await press(key);
    await fireEvent.changeText(screen.getByLabelText("Account name"), "  Rainy day  ");
    await press("Save");

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Rainy day",
      type: "savings",
      currency: "AED",
      openingBalanceMinor: 25075,
    });
  });

  it("records an opening balance that is money owed as negative", async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    await render(<AccountEditorForm defaultCurrency="USD" onSubmit={onSubmit} />);

    for (const key of ["4", "0"]) await press(key);
    await press("Opening balance is money held");
    await fireEvent.changeText(screen.getByLabelText("Account name"), "Visa");
    await press("Save");

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ openingBalanceMinor: -4000 }));
  });

  it("asks for a name before saving", async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    await render(<AccountEditorForm defaultCurrency="USD" onSubmit={onSubmit} />);

    await press("Save");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Give this account a name so you can spot it later.",
    );
  });

  it("prefills an existing account and keeps its owed balance on save", async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    await render(<AccountEditorForm account={card} defaultCurrency="USD" onSubmit={onSubmit} />);

    expect(screen.getByText("Edit account")).toBeOnTheScreen();
    expect(screen.getByLabelText("Account name")).toHaveDisplayValue("Travel card");
    expect(screen.getByRole("button", { name: "Opening balance is money owed" })).toBeOnTheScreen();
    await press("Save");

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Travel card",
      type: "credit_card",
      currency: "EUR",
      openingBalanceMinor: -12050,
    });
  });

  it("does not send a negative zero when owed is toggled on an empty balance", async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    await render(<AccountEditorForm defaultCurrency="USD" onSubmit={onSubmit} />);

    await press("Opening balance is money held");
    await fireEvent.changeText(screen.getByLabelText("Account name"), "Wallet");
    await press("Save");

    // Jest compares numbers with Object.is, so this fails if -0 is sent.
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Wallet",
      type: "checking",
      currency: "USD",
      openingBalanceMinor: 0,
    });
  });
});
