import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";

import type { V2LedgerScope } from "@trove/api/v2/contracts";

import { scopeKey } from "@/data/ledger-collections";
import { budgetCurrencyStorageKey, updateBudgetCurrencyState } from "@/data/budget-currency-store";
import { useBudgetingEnabled } from "@/features/feature-flags";
import { useLedgerScope } from "@/navigation/ledger-scope-context";

import { PAYDAY_ROUTES } from "../payday/payday-flow";

import {
  configureNotifications,
  reminderTap,
  sameLedgerScope,
  type ReminderTarget,
} from "./notifications";

const ROUTES = {
  due: "/budget/due",
  payday: PAYDAY_ROUTES.gotPaid,
} as const satisfies Record<ReminderTarget, string>;

interface PendingRoute {
  readonly scope: V2LedgerScope;
  readonly route: (typeof ROUTES)[ReminderTarget];
  readonly currency: string | null;
}

/** Makes the reminder's budget the one the next screen shows, then opens the route. */
function openRoute(
  identityKey: string,
  scope: V2LedgerScope,
  currency: string | null,
  route: (typeof ROUTES)[ReminderTarget],
) {
  if (currency === null) {
    router.push(route);
    return;
  }
  updateBudgetCurrencyState(budgetCurrencyStorageKey(scopeKey(identityKey, scope)), (state) => ({
    ...state,
    selected: currency,
  }))
    .catch(() => undefined)
    .then(() => router.push(route));
}

/**
 * Shows reminders in the foreground, and opens the Due list or Got paid when a reminder is
 * tapped, including a cold start. The reminder's ledger and budget are selected first, so a
 * household bill never opens the Personal Due list and a USD bill never opens the AED one; a
 * reminder for another identity is ignored.
 */
export function useReminderTapRouting(identityKey: string): void {
  const lastResponse = Notifications.useLastNotificationResponse();
  const { scope, selectScope } = useLedgerScope();
  // Budget routes are closed while Budgeting is off; a tap waits for the flag instead of being lost.
  const response = useBudgetingEnabled() ? lastResponse : null;
  const handled = useRef<string | null>(null);
  const [pending, setPending] = useState<PendingRoute | null>(null);

  useEffect(() => {
    configureNotifications();
  }, []);

  useEffect(() => {
    if (!response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const { identifier } = response.notification.request;
    const marker = `${identifier}:${response.notification.date}`;
    if (handled.current === marker) return;
    handled.current = marker;

    const tap = reminderTap(response.notification.request.content.data);
    if (!tap) return;
    if (tap.ledger && tap.ledger.identityKey !== identityKey) return;
    const target = tap.ledger?.scope ?? scope;
    if (sameLedgerScope(target, scope)) {
      openRoute(identityKey, target, tap.currency, ROUTES[tap.target]);
      return;
    }
    // Switching ledgers remounts the screens, so the route is pushed once the new scope is in.
    setPending({ scope: target, route: ROUTES[tap.target], currency: tap.currency });
    selectScope(target);
  }, [response, identityKey, scope, selectScope]);

  useEffect(() => {
    if (!pending) return;
    if (sameLedgerScope(pending.scope, scope)) {
      openRoute(identityKey, pending.scope, pending.currency, pending.route);
    }
    setPending(null);
  }, [pending, scope, identityKey]);
}
