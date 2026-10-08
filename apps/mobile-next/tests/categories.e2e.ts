import { describe } from "@e2e-dev/mobile";
import { expect } from "e2e";

import { test } from "./support/fixtures";
import { addCategory } from "./support/ledger";

describe("categories", { tags: ["categories"] }, () => {
  test("a category created from the Create sheet is filed under its kind", async ({ screen }) => {
    await addCategory(screen, { name: "Freelance", kind: "Income" });

    await screen.getByRole("button", "Ledger").tap();
    await screen.getByRole("button", "Open Categories").tap();
    await expect(screen.getByRole("button", "Freelance")).toBeVisible();

    await screen.getByRole("button", "Expense").tap();
    await expect(screen.getByRole("button", "Freelance")).toBeHidden();
    await screen.getByRole("button", "Income").tap();
    await expect(screen.getByRole("button", "Freelance")).toBeVisible();
  });

  test("a category needs a name before it saves", async ({ screen }) => {
    await screen.getByRole("button", "Create").longPress();
    await screen.getByRole("button", "Category").tap();
    await screen.getByRole("button", "Save").tap();

    await expect(screen.getByText("Name this category so it's easy to pick later.")).toBeVisible();
    await expect(screen.getByText("New category")).toBeVisible();
  });
});
