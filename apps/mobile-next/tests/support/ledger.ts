import type { Screen } from "e2e";
import { expect } from "e2e";

/** Types an amount on the editor's number pad, one key per character ("42.5"). */
export async function enterAmount(screen: Screen, amount: string): Promise<void> {
  for (const key of amount) {
    await screen.getByRole("button", key === "." ? "Decimal point" : key).tap();
  }
}

export interface NewAccount {
  readonly name: string;
  /** Opening balance as typed on the pad; omit for zero. */
  readonly openingBalance?: string;
}

/** From Home with no accounts: creates one through the "Add account" editor and returns to Home. */
export async function addFirstAccount(screen: Screen, account: NewAccount): Promise<void> {
  await screen.getByRole("button", "Add account").tap();
  await expect(screen.getByText("New account")).toBeVisible();
  // The pad sits under the keyboard once the name field is focused, so the amount goes first.
  if (account.openingBalance) await enterAmount(screen, account.openingBalance);
  await screen.getByLabel("Account name").fill(account.name);
  await screen.getByRole("button", "Save").tap();
  await expect(screen.getByText("Add an account to start your overview.")).toBeHidden();
}

export interface NewTransaction {
  readonly amount: string;
  readonly note: string;
}

/** Opens the New transaction editor from the tab bar, saves an expense, and waits for it to close. */
export async function addExpense(screen: Screen, transaction: NewTransaction): Promise<void> {
  await screen.getByRole("button", "Create").tap();
  await expect(screen.getByText("New transaction")).toBeVisible();
  await enterAmount(screen, transaction.amount);
  await screen.getByLabel("Note").fill(transaction.note);
  await screen.getByRole("button", "Save").tap();
  await expect(screen.getByText("New transaction")).toBeHidden();
}

export interface NewCategory {
  readonly name: string;
  readonly kind: "Expense" | "Income";
}

/** Long-presses Create, picks Category from the sheet, and saves a new category. */
export async function addCategory(screen: Screen, category: NewCategory): Promise<void> {
  await screen.getByRole("button", "Create").longPress();
  await screen.getByRole("button", "Category").tap();
  await expect(screen.getByText("New category")).toBeVisible();
  await screen.getByRole("button", `${category.kind} category`).tap();
  await screen.getByLabel("Category name").fill(category.name);
  await screen.getByRole("button", "Save").tap();
  await expect(screen.getByText("New category")).toBeHidden();
}
