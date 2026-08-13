export type TransactionType = "income" | "expense" | "transfer";
export type RecurrenceInterval = "daily" | "weekly" | "monthly" | "yearly";
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
  description: string;
  recurringPaymentId: string | null; // set when auto-generated
  createdAt: string;
  updatedAt: string;
}

// ── RecurringPayment ──────────────────────────────────────────────────────────

export interface RecurringPayment {
  id: string;
  name: string;
  type: TransactionType;
  amount: number; // integer cents
  currency: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  description: string;
  interval: RecurrenceInterval;
  dayOfMonth: number | null; // 1–31 for monthly/yearly
  dayOfWeek: number | null; // 0–6 (Sun–Sat) for weekly
  monthOfYear: number | null; // 1–12 for yearly
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null;
  lastGeneratedDate: string | null;
  isActive: boolean;
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
