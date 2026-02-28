import { create } from "zustand";

interface UIState {
  // Currently viewed month (year + month 1-indexed)
  selectedYear: number;
  selectedMonth: number;
  // Active account filter (null = all accounts)
  activeAccountId: string | null;

  setSelectedMonth: (year: number, month: number) => void;
  setActiveAccountId: (id: string | null) => void;
}

const now = new Date();

export const useUIStore = create<UIState>((set) => ({
  selectedYear: now.getFullYear(),
  selectedMonth: now.getMonth() + 1,
  activeAccountId: null,

  setSelectedMonth: (year, month) => set({ selectedYear: year, selectedMonth: month }),
  setActiveAccountId: (id) => set({ activeAccountId: id }),
}));
