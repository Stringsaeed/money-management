export type TransactionType = "income" | "expense" | "transfer";
/** The unit a recurrence repeats on. Combined with `intervalCount` for "every N units". */
export type RecurrenceFrequency = "day" | "week" | "month" | "year";
export type AccountType = "checking" | "savings" | "cash" | "credit_card" | "investment" | "other";

// ── Account ──────────────────────────────────────────────────────────────────

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string; // ISO 4217 e.g. "USD"
  color: string; // hex e.g. "#4A90D9"
  icon: string; // emoji, with legacy SF Symbol names still supported
  initialBalance: number; // integer cents in account's currency
  excludeFromTotal: boolean;
  sortOrder: number;
  lifecycle: "active" | "archived";
  lifecycleChangedAt: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

// ── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string; // hex
  icon: string; // emoji
  parentId: string | null; // optional sub-category
  sortOrder: number;
  lifecycle: "active" | "archived";
  lifecycleChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Transaction ───────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  type: TransactionType;
  // amount is always in the account's currency (integer cents)
  amount: number;
  currency: string; // account's currency at time of entry
  // If the user paid in a different currency, store original for reference
  originalAmount: number | null;
  originalCurrency: string | null;
  // rate * 1_000_000 to avoid float storage. e.g. 1.0847 → 1084700
  exchangeRate: number | null;
  date: string; // "YYYY-MM-DD"
  accountId: string;
  toAccountId: string | null; // only for transfers
  categoryId: string | null;
  isRecurring: boolean;
  description: string;
  recurringRuleId: string | null; // preserved lineage for a Generated Transaction
  createdAt: string;
  updatedAt: string;
}

// ── Computed / query results ───────────────────────────────────────────────────

export interface AccountWithBalance extends Account {
  balance: number; // computed from transactions
}

export interface TransactionWithDetails extends Transaction {
  account: Pick<Account, "id" | "name" | "color" | "icon" | "currency">;
  toAccount: Pick<Account, "id" | "name" | "color" | "icon" | "currency"> | null;
  category: Pick<Category, "id" | "name" | "color" | "icon"> | null;
}

export interface DayGroup {
  date: string; // "YYYY-MM-DD"
  transactions: TransactionWithDetails[];
  totalIncome: number;
  totalExpense: number;
}
