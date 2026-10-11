import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";

import { PAYDAY_ROUTES } from "../payday/payday-flow";

import { configureNotifications, reminderTarget } from "./notifications";

/** Shows reminders in the foreground, and opens the Due list or Got paid when a reminder is tapped, including a cold start. */
export function useReminderTapRouting(): void {
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

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

    const target = reminderTarget(response.notification.request.content.data);
    if (!target) return;
    if (target === "due") router.push("/budget/due");
    else router.push(PAYDAY_ROUTES.gotPaid);
  }, [response]);
}
