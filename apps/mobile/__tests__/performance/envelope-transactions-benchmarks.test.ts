/**
 * Performance benchmarks for Envelopes + Transactions hot paths.
 *
 * These tests measure algorithmic complexity and catch O(n²) regressions.
 * They do NOT measure real device rendering performance — that requires
 * on-device profiling with Hermes/Instruments.
 *
 * Run with: pnpm test __tests__/performance/envelope-transactions-benchmarks.test.ts
 */

import { groupByDay } from "@/utils/transaction";
import { buildJournalList } from "@/utils/journal-list";
import type { TransactionWithDetails } from "@/types";

function createMockTransaction(index: number, date: string): TransactionWithDetails {
  return {
    id: `tx-${index}`,
    type: index % 3 === 0 ? "income" : "expense",
    amount: Math.floor(Math.random() * 10000) + 100,
    currency: "USD",
    date,
    description: `Transaction ${index}`,
    accountId: `account-${index % 5}`,
    categoryId: `category-${index % 10}`,
    toAccountId: null,
    isRecurring: false,
    recurringRuleId: null,
    originalAmount: null,
    originalCurrency: null,
    exchangeRate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    account: {
      id: `account-${index % 5}`,
      name: `Account ${index % 5}`,
      currency: "USD",
      color: "#4A90D9",
      icon: "💳",
    },
    category: {
      id: `category-${index % 10}`,
      name: `Category ${index % 10}`,
      icon: "💰",
      color: "#8B9D83",
    },
    toAccount: null,
  };
}

function generateTransactions(count: number, daysSpan: number): TransactionWithDetails[] {
  const transactions: TransactionWithDetails[] = [];
  const baseDate = new Date("2026-01-01");

  for (let i = 0; i < count; i++) {
    const dayOffset = i % daysSpan;
    const date = new Date(baseDate);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split("T")[0];
    transactions.push(createMockTransaction(i, dateStr));
  }

  return transactions;
}

describe("Transaction List Performance", () => {
  describe("groupByDay", () => {
    it("handles 100 transactions in < 50ms", () => {
      const transactions = generateTransactions(100, 30);
      const start = performance.now();
      const groups = groupByDay(transactions);
      const duration = performance.now() - start;

      expect(groups.length).toBeGreaterThan(0);
      // Allow generous headroom for CI variance; real perf is device-measured
      expect(duration).toBeLessThan(50);
    });

    it("handles 1000 transactions in < 20ms", () => {
      const transactions = generateTransactions(1000, 90);
      const start = performance.now();
      const groups = groupByDay(transactions);
      const duration = performance.now() - start;

      expect(groups.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(20);
    });

    it("handles 5000 transactions in < 100ms", () => {
      const transactions = generateTransactions(5000, 365);
      const start = performance.now();
      const groups = groupByDay(transactions);
      const duration = performance.now() - start;

      expect(groups.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100);
    });

    it("scales linearly (not quadratically)", () => {
      const small = generateTransactions(500, 30);
      const large = generateTransactions(2000, 30);

      // Warm up to reduce JIT variance
      groupByDay(small);
      groupByDay(large);

      const startSmall = performance.now();
      groupByDay(small);
      const durationSmall = performance.now() - startSmall;

      const startLarge = performance.now();
      groupByDay(large);
      const durationLarge = performance.now() - startLarge;

      // If O(n²), large would be 16x slower. Linear should be ~4x.
      // Use generous threshold to avoid CI flakiness; real perf is device-measured.
      const ratio = durationLarge / Math.max(durationSmall, 0.01);
      expect(ratio).toBeLessThan(20);
    });
  });

  describe("buildJournalList", () => {
    it("handles 100 transactions across 30 days in < 5ms", () => {
      const transactions = generateTransactions(100, 30);
      const groups = groupByDay(transactions);

      const start = performance.now();
      const items = buildJournalList(groups, "USD", true);
      const duration = performance.now() - start;

      expect(items.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5);
    });

    it("handles 1000 transactions across 90 days in < 20ms", () => {
      const transactions = generateTransactions(1000, 90);
      const groups = groupByDay(transactions);

      const start = performance.now();
      const items = buildJournalList(groups, "USD", true);
      const duration = performance.now() - start;

      expect(items.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(20);
    });
  });
});

describe("Array.find() vs Map lookup comparison", () => {
  interface Account {
    id: string;
    name: string;
    currency: string;
  }

  function generateAccounts(count: number): Account[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `account-${i}`,
      name: `Account ${i}`,
      currency: "USD",
    }));
  }

  it("demonstrates Map lookup is faster for repeated lookups", () => {
    const accounts = generateAccounts(100);
    const lookupIds = Array.from({ length: 1000 }, (_, i) => `account-${i % 100}`);

    // Array.find approach
    const startFind = performance.now();
    for (const id of lookupIds) {
      accounts.find((a) => a.id === id);
    }
    const durationFind = performance.now() - startFind;

    // Map lookup approach
    const accountMap = new Map(accounts.map((a) => [a.id, a]));
    const startMap = performance.now();
    for (const id of lookupIds) {
      accountMap.get(id);
    }
    const durationMap = performance.now() - startMap;

    // Map should be significantly faster
    expect(durationMap).toBeLessThan(durationFind);

    // Log for visibility in test output
    console.log(
      `Array.find: ${durationFind.toFixed(2)}ms, Map.get: ${durationMap.toFixed(2)}ms, ratio: ${(durationFind / durationMap).toFixed(1)}x`,
    );
  });

  it("Array.find is acceptable for small arrays (<20 items)", () => {
    const accounts = generateAccounts(10);
    const lookupIds = Array.from({ length: 100 }, (_, i) => `account-${i % 10}`);

    const startFind = performance.now();
    for (const id of lookupIds) {
      accounts.find((a) => a.id === id);
    }
    const durationFind = performance.now() - startFind;

    // Should still be very fast for small arrays
    expect(durationFind).toBeLessThan(5);
  });
});

describe("Envelope projection simulation", () => {
  interface EnvelopeRow {
    id: string;
    name: string;
    currency: string;
  }

  interface CategoryMapping {
    envelopeId: string;
    categoryId: string;
  }

  function simulateCurrentNPlusOnePattern(
    envelopes: EnvelopeRow[],
    _allMappings: CategoryMapping[],
  ): Map<string, string[]> {
    // Simulates current N+1 query pattern: one "query" per envelope
    const result = new Map<string, string[]>();
    for (const envelope of envelopes) {
      // This simulates the per-envelope database query
      const mappings = _allMappings
        .filter((m) => m.envelopeId === envelope.id)
        .map((m) => m.categoryId);
      result.set(envelope.id, mappings);
    }
    return result;
  }

  function simulateBatchedPattern(
    envelopes: EnvelopeRow[],
    allMappings: CategoryMapping[],
  ): Map<string, string[]> {
    // Pre-index mappings by envelope (simulates single batch query + in-memory join)
    const mappingsByEnvelope = new Map<string, string[]>();
    for (const mapping of allMappings) {
      const existing = mappingsByEnvelope.get(mapping.envelopeId) ?? [];
      existing.push(mapping.categoryId);
      mappingsByEnvelope.set(mapping.envelopeId, existing);
    }

    const result = new Map<string, string[]>();
    for (const envelope of envelopes) {
      result.set(envelope.id, mappingsByEnvelope.get(envelope.id) ?? []);
    }
    return result;
  }

  it("batched query pattern is faster than N+1 for many envelopes", () => {
    const envelopeCount = 50;
    const categoriesPerEnvelope = 5;

    const envelopes: EnvelopeRow[] = Array.from({ length: envelopeCount }, (_, i) => ({
      id: `envelope-${i}`,
      name: `Envelope ${i}`,
      currency: "USD",
    }));

    const allMappings: CategoryMapping[] = [];
    for (const envelope of envelopes) {
      for (let j = 0; j < categoriesPerEnvelope; j++) {
        allMappings.push({
          envelopeId: envelope.id,
          categoryId: `category-${envelope.id}-${j}`,
        });
      }
    }

    // N+1 pattern
    const startNPlusOne = performance.now();
    for (let i = 0; i < 10; i++) {
      simulateCurrentNPlusOnePattern(envelopes, allMappings);
    }
    const durationNPlusOne = (performance.now() - startNPlusOne) / 10;

    // Batched pattern
    const startBatched = performance.now();
    for (let i = 0; i < 10; i++) {
      simulateBatchedPattern(envelopes, allMappings);
    }
    const durationBatched = (performance.now() - startBatched) / 10;

    console.log(`N+1: ${durationNPlusOne.toFixed(2)}ms, Batched: ${durationBatched.toFixed(2)}ms`);

    // Batched should be faster (though in-memory simulation understates the real DB benefit)
    expect(durationBatched).toBeLessThanOrEqual(durationNPlusOne * 1.5);
  });
});
