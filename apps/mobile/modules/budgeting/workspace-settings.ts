import type { SQLiteDatabase } from "@/db/sqlite";

import type { CurrencySettingRequest, Workspace, WorkspaceSelection } from "./types";
import { requireCurrency } from "./validation";

const HOME_CURRENCY_KEY = "budgetHomeCurrency";
const SELECTED_WORKSPACE_KEY = "budgetSelectedCurrency";

export async function getWorkspaceSelection(database: SQLiteDatabase): Promise<WorkspaceSelection> {
  const workspaces = await database.getAllAsync<Workspace>(
    `SELECT currency, activation_period AS activationPeriod
     FROM budget_workspaces
     ORDER BY currency`,
  );
  const currencies = new Set(workspaces.map(({ currency }) => currency));
  const settings = await database.getAllAsync<{ key: string; value: string }>(
    "SELECT key, value FROM app_settings WHERE key IN (?, ?)",
    HOME_CURRENCY_KEY,
    SELECTED_WORKSPACE_KEY,
  );
  const values = new Map(settings.map(({ key, value }) => [key, value]));
  const explicitHomeCurrency = values.get(HOME_CURRENCY_KEY);
  const fallbackCurrency = workspaces[0]?.currency ?? null;
  const hasExplicitHomeCurrency =
    explicitHomeCurrency !== undefined && currencies.has(explicitHomeCurrency);
  const homeCurrency = hasExplicitHomeCurrency ? explicitHomeCurrency : fallbackCurrency;
  const rememberedCurrency = values.get(SELECTED_WORKSPACE_KEY);
  const selectedCurrency =
    rememberedCurrency !== undefined && currencies.has(rememberedCurrency)
      ? rememberedCurrency
      : homeCurrency;

  return { workspaces, homeCurrency, hasExplicitHomeCurrency, selectedCurrency };
}

export async function setHomeCurrency(
  database: SQLiteDatabase,
  request: CurrencySettingRequest,
): Promise<void> {
  await setWorkspaceSetting(database, HOME_CURRENCY_KEY, request.currency);
}

export async function selectWorkspace(
  database: SQLiteDatabase,
  request: CurrencySettingRequest,
): Promise<void> {
  await setWorkspaceSetting(database, SELECTED_WORKSPACE_KEY, request.currency);
}

async function setWorkspaceSetting(
  database: SQLiteDatabase,
  key: string,
  requestedCurrency: string,
): Promise<void> {
  const currency = requireCurrency(requestedCurrency);
  const workspace = await database.getFirstAsync<{ currency: string }>(
    "SELECT currency FROM budget_workspaces WHERE currency = ?",
    currency,
  );
  if (!workspace) throw new Error(`The ${currency} budget workspace does not exist.`);
  await database.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    currency,
  );
}
