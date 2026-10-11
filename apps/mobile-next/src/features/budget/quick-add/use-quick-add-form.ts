import { useState } from "react";

import { BUDGET_CURRENCY, type V2Account, type V2Category } from "@trove/api/v2/contracts";

import { playCue } from "@/features/sound";
import { currencyFractionDigits, formatMoneyMinor, parseMoneyMinor } from "@/utils/money";

import { normalizeAmountEntry } from "../../ledger/transactions/amount-entry";
import { budgetToday } from "../due/due-model";
import type { ActiveBudgetView, EnvelopeLine } from "../home/home-model";

import {
  checkSpend,
  datePlacement,
  envelopeCategories,
  filterEnvelopes,
  orderEnvelopes,
  pickCategoryId,
  placementText,
  paidWithAccounts,
  resolveDefaultAccountId,
  spendImpact,
} from "./quick-add-model";
import type { QuickAddMemory } from "./quick-add-memory";
import { useSaveSpend, type SavedSpend } from "./use-save-spend";

interface UseQuickAddFormOptions {
  readonly view: ActiveBudgetView;
  readonly lines: readonly EnvelopeLine[];
  readonly accounts: readonly V2Account[];
  readonly categories: readonly V2Category[];
  readonly memory: QuickAddMemory;
  readonly remember: (spend: { accountId: string; envelopeId: string }) => Promise<void>;
  readonly preselectedEnvelopeId: string | null;
  readonly onSaved: (saved: SavedSpend) => void;
}

const FRACTION_DIGITS = currencyFractionDigits(BUDGET_CURRENCY);
const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** State and save for the Quick add sheet. Amount, envelope and Save need nothing else. */
export function useQuickAddForm(options: UseQuickAddFormOptions) {
  const { view, lines, accounts, categories, memory, remember, preselectedEnvelopeId, onSaved } =
    options;
  const saving = useSaveSpend({ remember, onSaved });
  const [amount, setAmount] = useState("");
  const [envelopeId, setEnvelopeId] = useState(preselectedEnvelopeId);
  const [accountOverride, setAccountOverride] = useState<string | null>(null);
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);
  const [note, setNote] = useState("");
  // The engine's date (Asia/Dubai), not the device clock, so the sheet and the server agree on today.
  const today = budgetToday(view.current);
  const [date, setDate] = useState(today);
  const [query, setQuery] = useState("");

  const ordered = orderEnvelopes(lines, memory.recentEnvelopeIds);
  const selected = lines.find((line) => line.envelope.id === envelopeId) ?? null;

  const { funding, cards } = paidWithAccounts(accounts, view.fundingAccountIds);
  const eligible = [...funding, ...cards];
  const accountId = resolveDefaultAccountId(
    eligible.map((account) => account.id),
    accountOverride ?? memory.lastAccountId,
    view.budget.defaultAccountId,
  );

  const choices = envelopeCategories(selected, categories);
  const categoryId = pickCategoryId(choices, categoryOverride);

  const amountMinor = parseMoneyMinor(normalizeAmountEntry(amount), BUDGET_CURRENCY) ?? 0;
  const placement = datePlacement({
    date,
    today,
    currentStart: view.current.period.start,
    activationStart: view.budget.activationPeriodStart,
    rule: view.paydayRule,
  });
  const impact = spendImpact(selected, placement, amountMinor, money);

  const submit = async (cover: boolean) => {
    const check = checkSpend({ amountMinor, envelope: selected, accountId, categoryId });
    if (!check.ok) return saving.fail(check.message);
    await saving.save({
      spend: check,
      date,
      note,
      placement,
      overMinor: impact?.overMinor ?? 0,
      cover,
    });
  };

  return {
    amount,
    fractionDigits: FRACTION_DIGITS,
    /** The keypad applies the entry rules and its own key haptic; this records the result. */
    changeAmount: (next: string) => {
      playCue("key");
      saving.clearError();
      setAmount(next);
    },
    clearAmount: () => setAmount(""),
    envelopes: filterEnvelopes(ordered, query, envelopeId),
    envelopeCount: lines.length,
    selected,
    selectEnvelope: (id: string) => {
      saving.clearError();
      setEnvelopeId(id);
      setCategoryOverride(null);
    },
    query,
    setQuery,
    funding,
    cards,
    accountId,
    selectAccount: (id: string) => {
      saving.clearError();
      setAccountOverride(id);
    },
    envelopeCategories: choices,
    categoryId,
    selectCategory: (id: string) => {
      saving.clearError();
      setCategoryOverride(id);
    },
    note,
    setNote,
    date,
    setDate,
    placementNote: placementText(placement),
    impact,
    busy: saving.busy,
    error: saving.error,
    submit,
  };
}
