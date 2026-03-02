import { create } from "zustand";

interface UIState {
  // null = "all time" (no month filter applied)
  selectedYear: number | null;
  selectedMonth: number | null; // 1-indexed
  // Active account filter (null = all accounts)
  activeAccountId: string | null;

  setSelectedMonth: (year: number | null, month: number | null) => void;
  setActiveAccountId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedYear: null,
  selectedMonth: null,
  activeAccountId: null,

  setSelectedMonth: (year, month) => set({ selectedYear: year, selectedMonth: month }),
  setActiveAccountId: (id) => set({ activeAccountId: id }),
}));
