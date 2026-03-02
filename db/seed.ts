/**
 * Demo seed — inserts realistic accounts, categories & transactions.
 * Safe to call repeatedly: checks if data already exists before inserting.
 */
import { drizzle } from "drizzle-orm/expo-sqlite";

import { accounts, categories, transactions } from "./schema";

type DB = ReturnType<typeof drizzle>;

const NOW = new Date().toISOString();

const ACCOUNTS = [
  {
    id: "seed_acc_checking",
    name: "Main Checking",
    type: "checking",
    currency: "USD",
    color: "#3B82F6",
    icon: "creditcard.fill",
    initialBalance: 500000, // $5,000
    excludeFromTotal: false,
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_acc_savings",
    name: "Savings",
    type: "savings",
    currency: "USD",
    color: "#10B981",
    icon: "banknote.fill",
    initialBalance: 1200000, // $12,000
    excludeFromTotal: false,
    sortOrder: 1,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_acc_cash",
    name: "Cash Wallet",
    type: "cash",
    currency: "USD",
    color: "#F59E0B",
    icon: "dollarsign.circle.fill",
    initialBalance: 20000, // $200
    excludeFromTotal: false,
    sortOrder: 2,
    createdAt: NOW,
    updatedAt: NOW,
  },
] as const;

const CATEGORIES = [
  // ── Expense ───────────────────────────────────────────────────────────────
  {
    id: "seed_cat_food",
    name: "Food & Dining",
    type: "expense",
    color: "#EF4444",
    icon: "fork.knife",
    parentId: null,
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_transport",
    name: "Transport",
    type: "expense",
    color: "#8B5CF6",
    icon: "car.fill",
    parentId: null,
    sortOrder: 1,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_shopping",
    name: "Shopping",
    type: "expense",
    color: "#F97316",
    icon: "bag.fill",
    parentId: null,
    sortOrder: 2,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_housing",
    name: "Housing",
    type: "expense",
    color: "#14B8A6",
    icon: "house.fill",
    parentId: null,
    sortOrder: 3,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_health",
    name: "Health",
    type: "expense",
    color: "#EC4899",
    icon: "heart.fill",
    parentId: null,
    sortOrder: 4,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_entertainment",
    name: "Entertainment",
    type: "expense",
    color: "#6366F1",
    icon: "tv.fill",
    parentId: null,
    sortOrder: 5,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_utilities",
    name: "Utilities",
    type: "expense",
    color: "#64748B",
    icon: "bolt.fill",
    parentId: null,
    sortOrder: 6,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_subscriptions",
    name: "Subscriptions",
    type: "expense",
    color: "#0EA5E9",
    icon: "star.fill",
    parentId: null,
    sortOrder: 7,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // ── Income ────────────────────────────────────────────────────────────────
  {
    id: "seed_cat_salary",
    name: "Salary",
    type: "income",
    color: "#22C55E",
    icon: "briefcase.fill",
    parentId: null,
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_freelance",
    name: "Freelance",
    type: "income",
    color: "#84CC16",
    icon: "laptopcomputer",
    parentId: null,
    sortOrder: 1,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_investment",
    name: "Investments",
    type: "income",
    color: "#F59E0B",
    icon: "chart.line.uptrend.xyaxis",
    parentId: null,
    sortOrder: 2,
    createdAt: NOW,
    updatedAt: NOW,
  },
] as const;

type TxRow = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  description: string;
  originalAmount: null;
  originalCurrency: null;
  exchangeRate: null;
  recurringPaymentId: null;
  createdAt: string;
  updatedAt: string;
};

function tx(
  id: string,
  type: "income" | "expense" | "transfer",
  amount: number, // dollars — converted to cents inside
  date: string,
  accountId: string,
  categoryId: string | null,
  description: string,
  toAccountId: string | null = null,
): TxRow {
  return {
    id,
    type,
    amount: Math.round(amount * 100),
    currency: "USD",
    date,
    accountId,
    toAccountId,
    categoryId,
    description,
    originalAmount: null,
    originalCurrency: null,
    exchangeRate: null,
    recurringPaymentId: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

const C = "seed_acc_checking";
const S = "seed_acc_savings";
const W = "seed_acc_cash";

const TRANSACTIONS: TxRow[] = [
  // ── January 2026 ────────────────────────────────────────────────────────
  tx("s_j01", "income", 4500, "2026-01-01", C, "seed_cat_salary", "January Salary"),
  tx("s_j02", "expense", 1200, "2026-01-02", C, "seed_cat_housing", "Rent"),
  tx("s_j03", "expense", 85, "2026-01-03", C, "seed_cat_food", "Grocery Run"),
  tx("s_j04", "expense", 42, "2026-01-05", W, "seed_cat_food", "Lunch"),
  tx("s_j05", "expense", 55, "2026-01-07", C, "seed_cat_transport", "Uber"),
  tx("s_j06", "expense", 14.99, "2026-01-08", C, "seed_cat_subscriptions", "Netflix"),
  tx("s_j07", "expense", 9.99, "2026-01-08", C, "seed_cat_subscriptions", "Spotify"),
  tx("s_j08", "expense", 350, "2026-01-10", C, "seed_cat_shopping", "Winter Jacket"),
  tx("s_j09", "expense", 62, "2026-01-12", W, "seed_cat_food", "Coffee Shop"),
  tx("s_j10", "expense", 98, "2026-01-14", C, "seed_cat_utilities", "Electric Bill"),
  tx("s_j11", "income", 850, "2026-01-15", C, "seed_cat_freelance", "Logo Design Project"),
  tx("s_j12", "expense", 75, "2026-01-16", C, "seed_cat_food", "Dinner Out"),
  tx("s_j13", "expense", 120, "2026-01-18", C, "seed_cat_health", "Dentist"),
  tx("s_j14", "expense", 25, "2026-01-20", W, "seed_cat_transport", "Bus Pass"),
  tx("s_j15", "expense", 32, "2026-01-22", C, "seed_cat_entertainment", "Cinema Tickets"),
  tx("s_j16", "expense", 48, "2026-01-25", C, "seed_cat_food", "Supermarket"),
  tx("s_j17", "transfer", 500, "2026-01-26", C, null, "Monthly Savings", S),

  // ── February 2026 ───────────────────────────────────────────────────────
  tx("s_f01", "income", 4500, "2026-02-01", C, "seed_cat_salary", "February Salary"),
  tx("s_f02", "expense", 1200, "2026-02-02", C, "seed_cat_housing", "Rent"),
  tx("s_f03", "expense", 92, "2026-02-03", C, "seed_cat_food", "Weekly Groceries"),
  tx("s_f04", "expense", 45, "2026-02-05", W, "seed_cat_food", "Street Food"),
  tx("s_f05", "expense", 14.99, "2026-02-07", C, "seed_cat_subscriptions", "Netflix"),
  tx("s_f06", "expense", 9.99, "2026-02-07", C, "seed_cat_subscriptions", "Spotify"),
  tx("s_f07", "expense", 68, "2026-02-08", C, "seed_cat_utilities", "Internet Bill"),
  tx("s_f08", "expense", 180, "2026-02-10", C, "seed_cat_shopping", "Shoes"),
  tx("s_f09", "income", 1200, "2026-02-10", C, "seed_cat_freelance", "App Development"),
  tx("s_f10", "expense", 55, "2026-02-12", C, "seed_cat_transport", "Gas"),
  tx("s_f11", "expense", 89, "2026-02-13", C, "seed_cat_food", "Valentine's Dinner 🌹"),
  tx("s_f12", "income", 230, "2026-02-14", S, "seed_cat_investment", "Dividend Payout"),
  tx("s_f13", "expense", 42, "2026-02-15", W, "seed_cat_food", "Coffee & Snacks"),
  tx("s_f14", "expense", 250, "2026-02-16", C, "seed_cat_entertainment", "Concert Tickets 🎵"),
  tx("s_f15", "expense", 72, "2026-02-18", C, "seed_cat_health", "Gym Membership"),
  tx("s_f16", "expense", 110, "2026-02-20", C, "seed_cat_food", "Groceries"),
  tx("s_f17", "expense", 36, "2026-02-22", W, "seed_cat_transport", "Parking"),
  tx("s_f18", "expense", 59, "2026-02-24", C, "seed_cat_shopping", "Books 📚"),
  tx("s_f19", "transfer", 500, "2026-02-26", C, null, "Monthly Savings", S),

  // ── March 2026 (first few days) ─────────────────────────────────────────
  tx("s_m01", "income", 4500, "2026-03-01", C, "seed_cat_salary", "March Salary"),
  tx("s_m02", "expense", 1200, "2026-03-01", C, "seed_cat_housing", "Rent"),
  tx("s_m03", "expense", 38, "2026-03-02", W, "seed_cat_food", "Morning Coffee ☕"),
  tx("s_m04", "expense", 72, "2026-03-02", C, "seed_cat_food", "Lunch with Team"),
  tx("s_m05", "expense", 14.99, "2026-03-03", C, "seed_cat_subscriptions", "Netflix"),
  tx("s_m06", "expense", 45, "2026-03-03", C, "seed_cat_transport", "Taxi"),
];

export async function seedDatabase(db: DB): Promise<void> {
  // Bail out if any accounts already exist (already seeded or user has their own data)
  const existing = await db.select({ id: accounts.id }).from(accounts).limit(1).all();

  if (existing.length > 0) return;

  for (const row of ACCOUNTS) {
    await db.insert(accounts).values(row);
  }
  for (const row of CATEGORIES) {
    await db.insert(categories).values(row);
  }
  for (const row of TRANSACTIONS) {
    await db.insert(transactions).values(row);
  }
}
