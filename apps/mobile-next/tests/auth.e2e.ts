import { expect } from "e2e";

import { signedOutTest as test } from "./support/fixtures";

test("a new visitor starts a guest ledger", async ({ screen }) => {
  await expect(screen.getByText("Your money, clearly.")).toBeVisible();
  await screen.getByRole("button", "Continue as guest").tap();
  await expect(screen.getByText("Add an account to start your overview.")).toBeVisible({
    timeout: 30_000,
  });
});

test("ending a guest session returns to the sign-in screen", async ({ screen }) => {
  await screen.getByRole("button", "Continue as guest").tap();
  await expect(screen.getByText("Add an account to start your overview.")).toBeVisible({
    timeout: 30_000,
  });

  await screen.getByRole("button", "Open profile").tap();
  await screen.getByRole("button", "End guest session").tap();
  await screen.getByRole("button", "End session").tap();

  await expect(screen.getByRole("button", "Continue as guest")).toBeVisible();
  await expect(screen.getByText("Your money, clearly.")).toBeVisible();
});
