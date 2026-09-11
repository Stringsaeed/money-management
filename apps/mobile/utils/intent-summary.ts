import type { CommandKind } from "@trove/protocol";

const KIND_LABELS: Record<CommandKind, string> = {
  "account.create": "New account",
  "account.update": "Update account",
  "account.archive": "Archive account",
  "category.create": "New category",
  "category.update": "Update category",
  "category.archive": "Archive category",
  "transaction.create": "Record transaction",
  "transaction.edit": "Edit transaction",
  "transaction.remove": "Delete transaction",
  "recurring.change": "Change recurring rule",
  "budget.configure": "Change budget",
  "assignment.commit": "Assign transactions",
  "assignment.correct": "Correct assignment",
  "refund.link": "Link refund",
  import_bundle: "Import data",
};

export function commandKindLabel(kind: CommandKind): string {
  return KIND_LABELS[kind] ?? kind;
}

function readString(payload: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function readMinorAmount(payload: Record<string, unknown>): number | null {
  const value = payload.amountMinor ?? payload.amount_minor;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatMinor(amountMinor: number): string {
  const abs = Math.abs(amountMinor);
  const whole = Math.trunc(abs / 100);
  const cents = `${abs % 100}`.padStart(2, "0");
  return `$${whole.toLocaleString("en-US")}.${cents}`;
}

/**
 * One-line summary of what the user originally tried to do, e.g.
 * "Record transaction · $12.00 · Groceries". Falls back to a JSON digest for
 * payloads it does not recognize so nothing renders as blank.
 */
export function describeIntent(kind: CommandKind, payload: unknown): string {
  if (typeof payload !== "object" || payload === null) {
    return commandKindLabel(kind);
  }
  const record = payload as Record<string, unknown>;
  const parts: string[] = [commandKindLabel(kind)];

  const name = readString(record, ["name", "description", "note"]);
  if (name) {
    parts.push(name.length > 60 ? `${name.slice(0, 57)}…` : name);
  }

  const amountMinor = readMinorAmount(record);
  if (amountMinor !== null) {
    const sign = amountMinor < 0 ? "-" : "";
    parts.push(`${sign}${formatMinor(amountMinor)}`);
  }

  const email = readString(record, ["email"]);
  if (email && !name) {
    parts.push(email);
  }

  if (parts.length === 1) {
    const fallbackKeys = Object.keys(record).slice(0, 3);
    if (fallbackKeys.length > 0) {
      parts.push(
        fallbackKeys.map((key) => `${key}: ${String(record[key]).slice(0, 20)}`).join(", "),
      );
    }
  }

  return parts.join(" · ");
}
