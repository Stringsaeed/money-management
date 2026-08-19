import type { SQLiteDatabase } from "expo-sqlite";

import { decodeSetupDraft, UnreadableSetupDraftError } from "./setup-draft-codec";
import { GUIDED_SETUP_DRAFT_ID, type SetupDraft } from "./setup-draft-types";
import { validateSetupDraft } from "./setup-draft-validation";

interface SetupDraftRow {
  payload: string;
}

export async function loadSetupDraft(database: SQLiteDatabase): Promise<SetupDraft | null> {
  const row = await database.getFirstAsync<SetupDraftRow>(
    "SELECT payload FROM setup_drafts WHERE id = ?",
    GUIDED_SETUP_DRAFT_ID,
  );
  if (!row) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(row.payload) as unknown;
  } catch {
    throw new UnreadableSetupDraftError();
  }
  return decodeSetupDraft(parsed);
}

export async function saveSetupDraft(
  database: SQLiteDatabase,
  draft: SetupDraft,
  now: string,
): Promise<SetupDraft> {
  const next = { ...draft, updatedAt: now };
  await validateSetupDraft(database, next);
  await database.runAsync(
    `INSERT INTO setup_drafts (id, payload, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    GUIDED_SETUP_DRAFT_ID,
    JSON.stringify(next),
    next.createdAt,
    next.updatedAt,
  );
  return next;
}

export async function discardSetupDraft(database: SQLiteDatabase): Promise<void> {
  await database.runAsync("DELETE FROM setup_drafts WHERE id = ?", GUIDED_SETUP_DRAFT_ID);
}
