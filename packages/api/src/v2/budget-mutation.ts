import { Context, Effect, Exit, Layer } from "effect";

import { LedgerRefused } from "./budget-errors";
import { LedgerFacts } from "./budget-ledger-facts";
import { BudgetLedger, LedgerDb } from "./budget-services";
import { BudgetStore } from "./budget-store";
import { ReminderStore } from "./recurring-reminder-store";
import { V2ApiError, withLedgerMutation, type V2TransactionDatabase } from "./shared";

/** The stores a budget program reads and writes through, over whatever executor `LedgerDb` holds. */
export type BudgetStores = BudgetStore | LedgerFacts | ReminderStore;
export const budgetStoresLayer = Layer.mergeAll(
  BudgetStore.layer,
  LedgerFacts.layer,
  ReminderStore.layer,
);

/** Thrown only inside the drizzle callback, so the failed program's writes roll back. */
class ProgramFailed extends Error {
  constructor() {
    super("The budget program failed; its ledger transaction rolls back.");
  }
}

/**
 * Runs `program` as one V2 ledger mutation (`withLedgerMutation`): one
 * database transaction under the ledger advisory lock, the ownership and guest
 * session recheck, and Idempotency-Key replay. Inside, the stores use the
 * transaction. A program failure rolls every write back and stores no
 * idempotency row, so a retry re-evaluates. A replayed key returns the stored
 * response without running the program.
 */
export const inLedgerMutation = <A, E, R>(
  operation: string,
  idempotencyKey: string | undefined,
  program: Effect.Effect<A, E, R>,
): Effect.Effect<A, E | LedgerRefused, BudgetLedger | Exclude<R, BudgetStores | LedgerDb>> =>
  Effect.gen(function* () {
    const ledger = yield* BudgetLedger;
    const outer = yield* Effect.context<BudgetLedger | Exclude<R, BudgetStores | LedgerDb>>();
    let failed: Exit.Exit<A, E> | undefined;

    const runInTransaction = async (tx: V2TransactionDatabase): Promise<A> => {
      const exit = await Effect.runPromiseExitWith(Context.add(outer, LedgerDb, tx))(
        // SAFETY: `outer` plus LedgerDb and the store Layers supply every service in R.
        // `fresh`: the request already built these stores over the pool; these use the transaction.
        program.pipe(Effect.provide(Layer.fresh(budgetStoresLayer))) as Effect.Effect<
          A,
          E,
          BudgetLedger | LedgerDb | Exclude<R, BudgetStores | LedgerDb>
        >,
      );
      if (Exit.isSuccess(exit)) return exit.value;
      failed = exit;
      throw new ProgramFailed();
    };

    const exit = yield* Effect.promise(() =>
      withLedgerMutation(ledger, operation, idempotencyKey, runInTransaction).then(
        (value): Exit.Exit<A, E | LedgerRefused> => Exit.succeed(value),
        (error): Exit.Exit<A, E | LedgerRefused> => {
          if (error instanceof ProgramFailed && failed) return failed;
          // The mutation preflight (ownership, guest session, key reuse) refused it.
          if (error instanceof V2ApiError) return Exit.fail(new LedgerRefused({ refusal: error }));
          return Exit.die(error);
        },
      ),
    );
    return yield* exit;
  });
