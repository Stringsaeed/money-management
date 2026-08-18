import { isMatch, isValid, parse } from "date-fns";
import type { SQLiteDatabase } from "expo-sqlite";

import { runInTransaction } from "@/modules/recurring-rules/persistence";

const CONFIRMATION_TTL_MS = 5 * 60 * 1000;

export interface FutureCategoryMappingIntent {
  categoryId: string;
  envelopeId: string;
  currentPeriod: string;
  effectiveFromPeriod: string;
  confirmationToken?: string;
}

export type FutureCategoryMappingResult =
  | {
      kind: "confirmation_required";
      confirmationToken: string;
      preview: Omit<FutureCategoryMappingIntent, "confirmationToken">;
    }
  | { kind: "invalid_confirmation" }
  | { kind: "applied"; effects: readonly ["projections"] };

interface FutureCategoryMappingOptions {
  database: SQLiteDatabase;
  now: () => Date;
  nextConfirmationToken: () => string;
}

interface PendingConfirmation {
  canonicalIntent: string;
  expiresAt: number;
}

export interface FutureCategoryMappingCommand {
  change(intent: FutureCategoryMappingIntent): Promise<FutureCategoryMappingResult>;
}

export function createFutureCategoryMappingCommand(
  options: FutureCategoryMappingOptions,
): FutureCategoryMappingCommand {
  const confirmations = new Map<string, PendingConfirmation>();

  return {
    async change(intent) {
      const canonicalIntent = canonicalizeIntent(intent);
      await validateFutureMapping(options.database, intent);

      if (!intent.confirmationToken) {
        const confirmationToken = options.nextConfirmationToken();
        confirmations.set(confirmationToken, {
          canonicalIntent,
          expiresAt: options.now().getTime() + CONFIRMATION_TTL_MS,
        });
        return {
          kind: "confirmation_required",
          confirmationToken,
          preview: withoutConfirmation(intent),
        };
      }

      const confirmation = confirmations.get(intent.confirmationToken);
      confirmations.delete(intent.confirmationToken);
      if (
        !confirmation ||
        confirmation.expiresAt < options.now().getTime() ||
        confirmation.canonicalIntent !== canonicalIntent
      ) {
        return { kind: "invalid_confirmation" };
      }

      return runInTransaction(options.database, async (transaction) => {
        await validateFutureMapping(transaction, intent);
        await transaction.runAsync(
          `INSERT INTO category_mappings (
            category_id, envelope_id, effective_from_period, effective_to_period, created_at
          ) VALUES (?, ?, ?, NULL, ?)`,
          intent.categoryId,
          intent.envelopeId,
          intent.effectiveFromPeriod,
          options.now().toISOString(),
        );
        return { kind: "applied", effects: ["projections"] as const };
      });
    },
  };
}

async function validateFutureMapping(
  database: SQLiteDatabase,
  intent: FutureCategoryMappingIntent,
): Promise<void> {
  assertPeriod(intent.currentPeriod, "current");
  assertPeriod(intent.effectiveFromPeriod, "effective-from");
  if (intent.effectiveFromPeriod <= intent.currentPeriod) {
    throw new Error("A restored Category Mapping must begin in a future Budget Period.");
  }

  const category = await database.getFirstAsync<{
    lifecycle: string;
    lifecycleChangedAt: string | null;
    type: string;
  }>(
    `SELECT lifecycle, lifecycle_changed_at AS lifecycleChangedAt, type
     FROM categories WHERE id = ?`,
    intent.categoryId,
  );
  if (!category || category.lifecycle !== "active" || category.lifecycleChangedAt === null) {
    throw new Error("Only a restored Category can create a confirmed future Mapping.");
  }
  if (category.type !== "expense") {
    throw new Error("Only an expense Category can map to an Envelope.");
  }

  const envelope = await database.getFirstAsync<{ id: string }>(
    "SELECT id FROM envelopes WHERE id = ? AND lifecycle = 'active'",
    intent.envelopeId,
  );
  if (!envelope) throw new Error("Choose an active Envelope for this Category Mapping.");
}

function canonicalizeIntent(intent: FutureCategoryMappingIntent): string {
  return JSON.stringify(withoutConfirmation(intent));
}

function withoutConfirmation(
  intent: FutureCategoryMappingIntent,
): Omit<FutureCategoryMappingIntent, "confirmationToken"> {
  const { confirmationToken: _confirmationToken, ...canonical } = intent;
  return canonical;
}

function assertPeriod(period: string, label: string): void {
  if (!isMatch(period, "yyyy-MM") || !isValid(parse(period, "yyyy-MM", new Date(0)))) {
    throw new Error(`Category Mapping requires a valid ${label} Budget Period.`);
  }
}
