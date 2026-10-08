import { describe } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { test } from "./support/fixtures";
import { addCategory, addExpense, addFirstAccount, enterAmount } from "./support/ledger";

// The model drives each goal (finding and opening things); exact values such as amounts go
// through `screen`, and every goal is pinned by an exact check right after it. Exclude these
// when no model is signed in: `pnpm test:e2e --exclude-tag agent`.
describe("agent flows", { tags: ["agent"] }, () => {
  test("income booked to a category lands in the ledger", async ({ agent, screen }) => {
    await addFirstAccount(screen, { name: "Everyday", openingBalance: "100" });
    await addCategory(screen, { name: "Freelance", kind: "Income" });

    await agent.act("open the New transaction editor and choose the {category} category", {
      params: { category: "Freelance" },
    });
    await expect(screen.getByRole("button", "Category: Freelance")).toBeVisible();

    await enterAmount(screen, "750");
    await screen.getByRole("button", "Save").tap();
    await expect(screen.getByText("New transaction")).toBeHidden();
    await expect(screen.getByText("$850.00")).toBeVisible();

    await screen.getByRole("button", "Ledger").tap();
    await expect(screen.getByText("Freelance, +$750.00")).toBeVisible();
  });

  test("an expense can be corrected after it is saved", async ({ agent, screen }) => {
    await addFirstAccount(screen, { name: "Everyday", openingBalance: "200" });
    await addExpense(screen, { amount: "30", note: "Taxi" });

    await agent.act("find the {note} transaction in the Ledger tab and open it", {
      params: { note: "Taxi" },
    });
    await expect(screen.getByText("Edit transaction")).toBeVisible();
    await expect(screen.getByText("Amount 30 USD")).toBeVisible();

    // Long-pressing the delete key clears the whole amount.
    await screen.getByRole("button", "Delete digit").longPress();
    await enterAmount(screen, "45");
    await screen.getByRole("button", "Save").tap();

    await expect(screen.getByText("Taxi, −$45.00")).toBeVisible();
    await expect(screen.getByText("Taxi, −$30.00")).toBeHidden();
  });
});
