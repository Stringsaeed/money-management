import { set } from "date-fns";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { z } from "zod";

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

// Payday notifications scheduled before Got paid existed carry "budget"; they open Got paid too.
const targetSchema = z.enum(["due", "payday", "budget"]);

/** The target a notification's data names, or null for anything else. */
export const reminderTarget = (data: Notifications.NotificationContent["data"]) => {
  const parsed = z.object({ target: targetSchema }).safeParse(data);
  if (!parsed.success) return null;
  return parsed.data.target === "budget" ? "payday" : parsed.data.target;
};

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

const identifierPrefix = (scopeId: string) => `trove-budget:${scopeId}:`;

let queue: Promise<unknown> = Promise.resolve();
const lastSynced = new Map<string, string>();

/**
 * Makes this ledger's scheduled budget notifications equal `reminders`: cancels the ones it
 * scheduled before, then schedules the new set. Safe to call repeatedly and concurrently.
 */
export function syncReminders(
  scopeId: string,
  reminders: readonly PlannedReminder[],
  now: Date,
): Promise<void> {
  const run = queue.then(() => apply(scopeId, reminders, now));
  queue = run.catch(() => undefined);
  return run;
}

async function apply(scopeId: string, reminders: readonly PlannedReminder[], now: Date) {
  const due = reminders.flatMap((reminder) => {
    const at = reminderMoment(reminder.day);
    return at && at > now ? [{ reminder, at }] : [];
  });
  const signature = JSON.stringify(due.map(({ reminder }) => reminder));
  if (lastSynced.get(scopeId) === signature) return;

  const prefix = identifierPrefix(scopeId);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.identifier.startsWith(prefix))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
  if (Platform.OS === "android" && due.length > 0) {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Budget reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  for (const { reminder, at } of due) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${prefix}${reminder.kind}:${reminder.day}`,
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { target: TARGETS[reminder.kind] },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: at,
        channelId: CHANNEL_ID,
      },
    });
  }
  lastSynced.set(scopeId, signature);
}
