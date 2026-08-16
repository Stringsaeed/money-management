import { loadAccount } from "./persistence";
import type {
  CreateRecurringRulesOptions,
  RecurringChange,
  RecurringChangeResult,
  RecurringPreview,
  RecurringRule,
} from "./types";

interface Confirmation {
  canonicalIntent: string;
  dependencySignature: string;
  localDate: string;
  expiresAt: number;
}

const CONFIRMATION_TTL_MS = 5 * 60 * 1000;

export class ConfirmationStore {
  private readonly confirmations = new Map<string, Confirmation>();

  constructor(private readonly options: CreateRecurringRulesOptions) {}

  async confirmOrPreview(
    intent: RecurringChange,
    candidate: Pick<RecurringRule, "accountId" | "toAccountId">,
    localDate: string,
    preview: RecurringPreview | null,
  ): Promise<RecurringChangeResult | null> {
    if (!preview) return null;

    const canonicalIntent = canonicalizeIntent(intent);
    const dependencySignature = await this.dependencySignature(candidate);
    const token = "confirmationToken" in intent ? intent.confirmationToken : undefined;
    if (this.consume(token, canonicalIntent, dependencySignature, localDate)) return null;

    const confirmationToken = this.options.identity.next("confirmation");
    this.confirmations.set(confirmationToken, {
      canonicalIntent,
      dependencySignature,
      localDate,
      expiresAt: this.options.clock.now().getTime() + CONFIRMATION_TTL_MS,
    });
    return { kind: "preview_required", confirmationToken, preview };
  }

  private consume(
    token: string | undefined,
    canonicalIntent: string,
    dependencySignature: string,
    localDate: string,
  ): boolean {
    if (!token) return false;
    const confirmation = this.confirmations.get(token);
    this.confirmations.delete(token);
    return (
      confirmation !== undefined &&
      confirmation.expiresAt >= this.options.clock.now().getTime() &&
      confirmation.canonicalIntent === canonicalIntent &&
      confirmation.dependencySignature === dependencySignature &&
      confirmation.localDate === localDate
    );
  }

  private async dependencySignature(
    rule: Pick<RecurringRule, "accountId" | "toAccountId">,
  ): Promise<string> {
    const source = rule.accountId ? await loadAccount(this.options.database, rule.accountId) : null;
    const destination = rule.toAccountId
      ? await loadAccount(this.options.database, rule.toAccountId)
      : null;
    return JSON.stringify({ source, destination });
  }
}

function canonicalizeIntent(intent: RecurringChange): string {
  const { confirmationToken: _confirmationToken, ...canonical } = intent as RecurringChange & {
    confirmationToken?: string;
  };
  return stableStringify(canonical);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
