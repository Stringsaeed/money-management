import { describe } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { test } from "./support/fixtures";
import { addFirstAccount, enterAmount } from "./support/ledger";

describe("accounts", { tags: ["accounts"] }, () => {
  test("a guest adds their first account with an opening balance", async ({ screen }) => {
    await screen.getByRole("button", "Add account").tap();
    await expect(screen.getByText("New account")).toBeVisible();

    await enterAmount(screen, "2500");
    await expect(screen.getByText("$2,500.00")).toBeVisible();
    await screen.getByLabel("Account name").fill("Everyday");
    await screen.getByRole("button", "Save").tap();

    // Back on Home, the overview now reflects the opening balance.
    await expect(screen.getByText("Add an account to start your overview.")).toBeHidden();
    await expect(screen.getByText("$2,500.00")).toBeVisible();
  });

  test("an account needs a name before it saves", async ({ screen }) => {
    await screen.getByRole("button", "Add account").tap();
    await enterAmount(screen, "10");
    await screen.getByRole("button", "Save").tap();

    await expect(
      screen.getByText("Give this account a name so you can spot it later."),
    ).toBeVisible();
    await expect(screen.getByText("New account")).toBeVisible();
  });

  test("a saved account is listed under Ledger > Accounts", async ({ screen }) => {
    await addFirstAccount(screen, { name: "Rainy day", openingBalance: "800" });

    await screen.getByRole("button", "Ledger").tap();
    await screen.getByRole("button", "Open Accounts").tap();
    await expect(screen.getByRole("button", "Rainy day")).toBeVisible();
  });
});
