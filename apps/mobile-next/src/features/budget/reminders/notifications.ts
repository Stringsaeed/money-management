import { set } from "date-fns";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { z } from "zod";

import type { V2LedgerScope } from "@trove/api/v2/contracts";

import { scopeKey } from "@/data/ledger-collections";
import { parseDateKey } from "@/utils/date";

import type { PlannedReminder } from "./reminder-plan";

export type ReminderPermission = "granted" | "denied" | "undetermined";

/** Where a tapped reminder lands. */
export type ReminderTarget = "due" | "payday";

const CHANNEL_ID = "budget-reminders";
/** Reminders go out at 09:00 on the device's clock. */
const REMINDER_HOUR = 9;

const TARGETS = {
  bills: "due",
  payday: "payday",
} as const satisfies Record<PlannedReminder["kind"], ReminderTarget>;

/** Whose reminder it is: the signed-in identity and the ledger it was planned for. */
export interface ReminderLedger {
  readonly identityKey: string;
  readonly scope: V2LedgerScope;
}

// Payday notifications scheduled before Got paid existed carry "budget"; they open Got paid too.
const targetSchema = z.enum(["due", "payday", "budget"]);
const scopeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("personal") }),
  z.object({ kind: z.literal("household"), householdId: z.string().min(1) }),
]);
const tapSchema = z.object({
  target: targetSchema,
  // Notifications scheduled before reminders carried their ledger have neither.
  identityKey: z.string().optional(),
  scope: scopeSchema.optional(),
});

export interface ReminderTap {
  readonly target: ReminderTarget;
  /** The ledger the reminder belongs to; absent on reminders scheduled before it was recorded. */
  readonly ledger: ReminderLedger | null;
}

/** Where a tapped notification's data says to go, and for which ledger; null for anything else. */
export function reminderTap(data: Notifications.NotificationContent["data"]): ReminderTap | null {
  const parsed = tapSchema.safeParse(data);
  if (!parsed.success) return null;
  const { target, identityKey, scope } = parsed.data;
  return {
    target: target === "budget" ? "payday" : target,
    ledger: identityKey && scope ? { identityKey, scope } : null,
  };
}

export const sameLedgerScope = (a: V2LedgerScope, b: V2LedgerScope): boolean =>
  a.kind === "personal"
    ? b.kind === "personal"
    : b.kind === "household" && a.householdId === b.householdId;

/** Shows a reminder that arrives while the app is open, as a banner without sound. */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const toPermission = (status: Notifications.PermissionStatus): ReminderPermission =>
  status === Notifications.PermissionStatus.GRANTED
    ? "granted"
    : status === Notifications.PermissionStatus.DENIED
      ? "denied"
      : "undetermined";

export async function getReminderPermission(): Promise<ReminderPermission> {
  const result = await Notifications.getPermissionsAsync();
  // iOS never asks twice: a denied answer that cannot be asked again is final.
  if (result.status === Notifications.PermissionStatus.DENIED && result.canAskAgain) {
    return "undetermined";
  }
  return toPermission(result.status);
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  const result = await Notifications.requestPermissionsAsync();
  return toPermission(result.status);
}

/** The delivery moment for a Ledger Date: that calendar day at the reminder hour, device time. */
export function reminderMoment(day: string): Date | null {
  const parsed = parseDateKey(day);
  return parsed ? set(parsed, { hours: REMINDER_HOUR, minutes: 0, seconds: 0 }) : null;
}

const BUDGET_PREFIX = "trove-budget:";
const identifierPrefix = (scopeId: string) => `${BUDGET_PREFIX}${scopeId}:`;

/** Every budget reminder this identity scheduled, in any ledger. */
export const identityReminderPrefix = (identityKey: string) => `${BUDGET_PREFIX}${identityKey}:`;

/** The budget reminders one ledger scheduled for this identity. */
export const ledgerReminderPrefix = ({ identityKey, scope }: ReminderLedger) =>
  identifierPrefix(scopeKey(identityKey, scope));

/** What a scheduled budget reminder shows, and what its data tells a tap. */
export interface ReminderContent {
  readonly title: string;
  readonly body: string;
  readonly data: ReminderData;
}

type ReminderData = {
  readonly target: ReminderTarget;
  readonly identityKey: string;
  readonly scope: V2LedgerScope;
};

/** The device's notification schedule, as far as budget reminders use it. */
export interface NotificationSchedule {
  readonly scheduledIds: () => Promise<readonly string[]>;
  readonly cancel: (identifier: string) => Promise<void>;
  readonly schedule: (identifier: string, content: ReminderContent, at: Date) => Promise<void>;
}

const deviceSchedule: NotificationSchedule = {
  scheduledIds: async () =>
    (await Notifications.getAllScheduledNotificationsAsync()).map((request) => request.identifier),
  cancel: (identifier) => Notifications.cancelScheduledNotificationAsync(identifier),
  schedule: async (identifier, content, at) => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Budget reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await Notifications.scheduleNotificationAsync({
      identifier,
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: at,
        channelId: CHANNEL_ID,
      },
    });
  },
};

/** Syncs and cancels budget reminders on one schedule, one change at a time. */
export function budgetReminderSchedule(device: NotificationSchedule) {
  let queue: Promise<unknown> = Promise.resolve();
  /** Last schedule per ledger prefix, so an unchanged plan is not rescheduled. */
  const lastSynced = new Map<string, string>();

  const serialise = (work: () => Promise<void>): Promise<void> => {
    const run = queue.then(work);
    queue = run.catch(() => undefined);
    return run;
  };

  const cancelMatching = async (matches: (identifier: string) => boolean) => {
    const ids = await device.scheduledIds();
    await Promise.all(ids.filter(matches).map((identifier) => device.cancel(identifier)));
  };

  const apply = async (
    ledger: ReminderLedger,
    reminders: readonly PlannedReminder[],
    now: Date,
  ) => {
    const due = reminders.flatMap((reminder) => {
      const at = reminderMoment(reminder.day);
      return at && at > now ? [{ reminder, at }] : [];
    });
    const prefix = ledgerReminderPrefix(ledger);
    const signature = JSON.stringify(due.map(({ reminder }) => reminder));
    if (lastSynced.get(prefix) === signature) return;

    await cancelMatching((identifier) => identifier.startsWith(prefix));
    for (const { reminder, at } of due) {
      await device.schedule(
        `${prefix}${reminder.kind}:${reminder.day}`,
        {
          title: reminder.title,
          body: reminder.body,
          data: {
            target: TARGETS[reminder.kind],
            identityKey: ledger.identityKey,
            scope: ledger.scope,
          },
        },
        at,
      );
    }
    lastSynced.set(prefix, signature);
  };

  return {
    /**
     * Makes this ledger's scheduled budget notifications equal `reminders`: cancels the ones it
     * scheduled before, then schedules the new set. Safe to call repeatedly and concurrently.
     */
    sync: (ledger: ReminderLedger, reminders: readonly PlannedReminder[], now: Date) =>
      serialise(() => apply(ledger, reminders, now)),
    /**
     * Cancels the scheduled budget reminders whose identifier `matches` (see the prefix helpers),
     * and forgets what was synced for them so the next sync schedules again. For sign-out, another
     * identity, and lost household access, so no lock screen shows a budget the person can't open.
     */
    cancel: (matches: (identifier: string) => boolean) =>
      serialise(async () => {
        for (const prefix of lastSynced.keys()) if (matches(prefix)) lastSynced.delete(prefix);
        await cancelMatching(
          (identifier) => identifier.startsWith(BUDGET_PREFIX) && matches(identifier),
        );
      }),
  };
}

const onDevice = budgetReminderSchedule(deviceSchedule);
export const syncReminders = onDevice.sync;
export const cancelBudgetReminders = onDevice.cancel;
