import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";

import { useDatabase } from "@/db/client";
import { recurringPayments } from "@/db/schema";
import { generateId } from "@/utils/id";
import { nowIso } from "@/utils/date";
import type { RecurringPayment } from "@/types";

// ── Query keys ────────────────────────────────────────────────────────────────

const recurringKeys = {
  all: ["recurring-payments"] as const,
  detail: (id: string) => ["recurring-payments", id] as const,
};

// ── Queries ────────────────────────────────────────────────────────────────────

export function useRecurringPayments() {
  const db = useDatabase();
  return useQuery({
    queryKey: recurringKeys.all,
    queryFn: () =>
      db
        .select()
        .from(recurringPayments)
        .orderBy(recurringPayments.name)
        .all() as RecurringPayment[],
  });
}

export function useRecurringPayment(id: string) {
  const db = useDatabase();
  return useQuery({
    queryKey: recurringKeys.detail(id),
    queryFn: () =>
      db.select().from(recurringPayments).where(eq(recurringPayments.id, id)).get() as
        | RecurringPayment
        | undefined,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

type NewRecurring = Omit<RecurringPayment, "id" | "createdAt" | "updatedAt">;

export function useCreateRecurringPayment() {
  const db = useDatabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewRecurring) => {
      const now = nowIso();
      const id = generateId();
      await db.insert(recurringPayments).values({ ...data, id, createdAt: now, updatedAt: now });
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
}

export function useUpdateRecurringPayment() {
  const db = useDatabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<RecurringPayment, "id" | "createdAt">>;
    }) => {
      await db
        .update(recurringPayments)
        .set({ ...data, updatedAt: nowIso() })
        .where(eq(recurringPayments.id, id));
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: recurringKeys.all });
      qc.invalidateQueries({ queryKey: recurringKeys.detail(id) });
    },
  });
}

export function useDeleteRecurringPayment() {
  const db = useDatabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(recurringPayments).where(eq(recurringPayments.id, id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
}
