import {
  budgetReminderSchedule,
  identityReminderPrefix,
  ledgerReminderPrefix,
  reminderTap,
  type NotificationSchedule,
  type ReminderContent,
} from "../notifications";

/** An in-memory notification schedule: identifier to content, like the device keeps it. */
function memorySchedule() {
  const scheduled = new Map<string, ReminderContent>();
  const schedule: NotificationSchedule = {
    scheduledIds: async () => [...scheduled.keys()],
    cancel: async (identifier) => {
      scheduled.delete(identifier);
    },
    schedule: async (identifier, content) => {
      scheduled.set(identifier, content);
    },
  };
  return { scheduled, reminders: budgetReminderSchedule(schedule) };
}

const sara = "user:sara";
const personal = { identityKey: sara, scope: { kind: "personal" } } as const;
const home = { identityKey: sara, scope: { kind: "household", householdId: "h1" } } as const;
const bill = {
  kind: "bills",
  currency: "USD",
  day: "2026-10-18",
  title: "Bill reminder",
  body: "du due today",
} as const;
const now = new Date("2026-10-11T06:00:00");

describe("budget reminders", () => {
  it("carry the identity and ledger, so a tap opens the right ledger", async () => {
    const { scheduled, reminders } = memorySchedule();
    await reminders.sync(home, [bill], now);
    const [content] = [...scheduled.values()];
    expect(reminderTap(content?.data)).toEqual({
      target: "due",
      ledger: { identityKey: sara, scope: { kind: "household", householdId: "h1" } },
      currency: "USD",
    });
  });

  it("keeps a payday notification per budget on the same day", async () => {
    const { scheduled, reminders } = memorySchedule();
    const payday = {
      kind: "payday",
      day: "2026-10-25",
      title: "Payday",
      body: "Did it land?",
    } as const;
    await reminders.sync(
      personal,
      [
        { ...payday, currency: "AED" },
        { ...payday, currency: "USD" },
      ],
      now,
    );
    expect([...scheduled.keys()]).toEqual([
      "trove-budget:user:sara:personal:payday:AED:2026-10-25",
      "trove-budget:user:sara:personal:payday:USD:2026-10-25",
    ]);
  });

  it("read an old reminder without a ledger as the current one", () => {
    expect(reminderTap({ target: "budget" })).toEqual({
      target: "payday",
      ledger: null,
      currency: null,
    });
    expect(reminderTap({ other: true })).toBeNull();
  });

  it("cancels one household's reminders when access is revoked, keeping Personal's", async () => {
    const { scheduled, reminders } = memorySchedule();
    await reminders.sync(personal, [bill], now);
    await reminders.sync(home, [bill], now);
    const prefix = ledgerReminderPrefix(home);
    await reminders.cancel((identifier) => identifier.startsWith(prefix));
    expect([...scheduled.keys()]).toEqual(["trove-budget:user:sara:personal:bills:2026-10-18"]);
  });

  it("cancels every reminder of an identity on sign-out, and schedules again on the next sync", async () => {
    const { scheduled, reminders } = memorySchedule();
    await reminders.sync(personal, [bill], now);
    await reminders.sync(home, [bill], now);
    const prefix = identityReminderPrefix(sara);
    await reminders.cancel((identifier) => identifier.startsWith(prefix));
    expect(scheduled.size).toBe(0);

    await reminders.sync(personal, [bill], now);
    expect([...scheduled.keys()]).toEqual(["trove-budget:user:sara:personal:bills:2026-10-18"]);
  });
});
