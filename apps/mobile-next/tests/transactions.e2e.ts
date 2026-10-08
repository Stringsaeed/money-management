import { describe } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { test } from "./support/fixtures";
import { addExpense, addFirstAccount, enterAmount } from "./support/ledger";

describe("transactions", { tags: ["transactions"] }, () => {
  test("an expense lowers the balance and shows in the ledger", async ({ screen }) => {
    await addFirstAccount(screen, { name: "Everyday", openingBalance: "100" });
    await expect(screen.getByText("$100.00")).toBeVisible();

    await addExpense(screen, { amount: "42.5", note: "Coffee beans" });

    await expect(screen.getByText("$57.50")).toBeVisible();
    await expect(screen.getByRole("button", "Open Coffee beans")).toBeVisible();

    await screen.getByRole("button", "Ledger").tap();
    await expect(screen.getByText("Coffee beans, −$42.50")).toBeVisible();
  });

  test("a transaction without an amount is not saved", async ({ screen }) => {
    await addFirstAccount(screen, { name: "Everyday" });

    await screen.getByRole("button", "Create").tap();
    await screen.getByRole("button", "Save").tap();

    await expect(
      screen.getByText("Enter an amount above zero to save this expense."),
    ).toBeVisible();
    await expect(screen.getByText("New transaction")).toBeVisible();
  });

  test("a new guest is asked to create an account before adding a transaction", async ({
    screen,
  }) => {
    await screen.getByRole("button", "Create").tap();
    await enterAmount(screen, "5");
    await screen.getByRole("button", "Save").tap();

    await expect(
      screen.getByText("Create an account first, then come back to add this transaction. 🏦"),
    ).toBeVisible();
  });

  test("searching the ledger narrows it to matching entries", async ({ screen }) => {
    await addFirstAccount(screen, { name: "Everyday", openingBalance: "500" });
    await addExpense(screen, { amount: "12", note: "Bakery" });
    await addExpense(screen, { amount: "60", note: "Gym membership" });

    await screen.getByRole("button", "Ledger").tap();
    await expect(screen.getByText("Bakery, −$12.00")).toBeVisible();
    await expect(screen.getByText("Gym membership, −$60.00")).toBeVisible();

    // Search is sent when the keyboard's search key is pressed, not per keystroke.
    const search = screen.getByLabel("Search transactions");
    await search.fill("Bakery");
    await search.press("Enter");
    await expect(screen.getByText("Bakery, −$12.00")).toBeVisible();
    await expect(screen.getByText("Gym membership, −$60.00")).toBeHidden();

    await search.fill("Plane tickets");
    await search.press("Enter");
    await expect(screen.getByText("Nothing matches")).toBeVisible();
  });
});
