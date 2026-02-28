import { create } from "zustand";
import type { AppSettings } from "@/types";

interface SettingsState extends AppSettings {
  isLoaded: boolean;
  setSettings: (settings: Partial<AppSettings>) => void;
  setLoaded: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  // Defaults — overwritten when loaded from SQLite on app start
  homeCurrency: "USD",
  dateFormat: "MM/DD/YYYY",
  firstDayOfWeek: 0,
  isLoaded: false,

  setSettings: (settings) => set((prev) => ({ ...prev, ...settings })),
  setLoaded: () => set({ isLoaded: true }),
}));
