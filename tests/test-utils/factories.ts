import { nowIso, today } from "@/utils/date";
import type {
  Account,
  AccountWithBalance,
  Category,
  DayGroup,
  RecurringPayment,
  Transaction,
  TransactionWithDetails,
} from "@/types";

const DEFAULT_TIMESTAMP = "2026-03-28T10:00:00.000Z";

export const createAccount = (overrides: Partial<Account> = {}): Account => ({
  id: "account-1",
  name: "Main Checking",
  type: "checking",
  currency: "USD",
  color: "#8B9D83",
  icon: "banknote.fill",
  initialBalance: 100_00,
  excludeFromTotal: false,
  sortOrder: 0,
  createdAt: DEFAULT_TIMESTAMP,
  updatedAt: DEFAULT_TIMESTAMP,
  ...overrides,
});

export const createAccountWithBalance = (
  overrides: Partial<AccountWithBalance> = {},
): AccountWithBalance => ({
  ...createAccount(overrides),
  balance: 250_00,
  ...overrides,
});

export const createCategory = (overrides: Partial<Category> = {}): Category => ({
  id: "category-1",
  name: "Groceries",
  type: "expense",
  color: "#B48A7B",
  icon: "🛒",
  parentId: null,
  sortOrder: 0,
  createdAt: DEFAULT_TIMESTAMP,
  updatedAt: DEFAULT_TIMESTAMP,
  ...overrides,
});

export const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: "transaction-1",
  type: "expense",
  amount: 45_00,
  currency: "USD",
  originalAmount: null,
  originalCurrency: null,
  exchangeRate: null,
  date: today(),
  accountId: "account-1",
  toAccountId: null,
  categoryId: "category-1",
  isRecurring: false,
  description: "Coffee",
  recurringPaymentId: null,
  createdAt: nowIso(),
  updatedAt: nowIso(),
  ...overrides,
});

export const createTransactionWithDetails = (
  overrides: Partial<TransactionWithDetails> = {},
): TransactionWithDetails => {
  const account = createAccount({
    id: overrides.account?.id ?? overrides.accountId ?? "account-1",
    name: overrides.account?.name ?? "Main Checking",
    color: overrides.account?.color ?? "#8B9D83",
    icon: overrides.account?.icon ?? "banknote.fill",
    currency: overrides.account?.currency ?? overrides.currency ?? "USD",
  });

  const categoryId =
    "categoryId" in overrides ? overrides.categoryId : (overrides.category?.id ?? "category-1");

  return {
    ...createTransaction({
      ...overrides,
      accountId: overrides.accountId ?? account.id,
      categoryId: categoryId ?? null,
    }),
    account: overrides.account ?? {
      id: account.id,
      name: account.name,
      color: account.color,
      icon: account.icon,
      currency: account.currency,
    },
    toAccount: overrides.toAccount ?? null,
    category:
      overrides.category === null
        ? null
        : (overrides.category ?? {
            id: categoryId ?? "category-1",
            name: "Groceries",
            color: "#B48A7B",
            icon: "🛒",
          }),
  };
};

export const createDayGroup = (overrides: Partial<DayGroup> = {}): DayGroup => ({
  date: "2026-03-28",
  transactions: [createTransactionWithDetails()],
  totalIncome: 0,
  totalExpense: 45_00,
  ...overrides,
});

export const createRecurringPayment = (
  overrides: Partial<RecurringPayment> = {},
): RecurringPayment => ({
  id: "recurring-1",
  name: "Rent",
  type: "expense",
  amount: 1200_00,
  currency: "USD",
  accountId: "account-1",
  toAccountId: null,
  categoryId: "category-1",
  description: "Monthly rent",
  interval: "monthly",
  dayOfMonth: 5,
  dayOfWeek: null,
  monthOfYear: null,
  startDate: "2026-01-05",
  endDate: null,
  lastGeneratedDate: null,
  isActive: true,
  createdAt: DEFAULT_TIMESTAMP,
  updatedAt: DEFAULT_TIMESTAMP,
  ...overrides,
});
