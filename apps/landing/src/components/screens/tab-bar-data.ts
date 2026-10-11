export type TabKey = "home" | "budget" | "ledger" | "market";
export type TabBarScope = "personal" | "household";
export type ScreenMode = "dark" | "paper";

interface TabDef {
  key: TabKey;
  /** Outline glyph, drawn on a 24px grid with a 1.75 stroke. */
  outline: string;
  /** Filled glyph shown when the tab is active. */
  filled: string;
}

const HOME = "M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z";

export const TAB_BAR_TABS: readonly TabDef[] = [
  { key: "home", outline: HOME, filled: HOME },
  {
    key: "budget",
    outline:
      "M3.5 7A1.5 1.5 0 0 1 5 5.5h14A1.5 1.5 0 0 1 20.5 7v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17zM4 7l8 6 8-6",
    filled:
      "M5 5h14a2 2 0 0 1 2 2v.4l-9 6.3-9-6.3V7a2 2 0 0 1 2-2zM3 9.2l9 6.3 9-6.3V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  },
  {
    key: "ledger",
    outline:
      "M12 6.5C10.5 5.3 8.5 4.8 4 5v13c4.5-.2 6.5.3 8 1.5 1.5-1.2 3.5-1.7 8-1.5V5c-4.5-.2-6.5.3-8 1.5zM12 6.5v13",
    filled:
      "M11.25 6.1C9.7 5 7.6 4.6 3.25 4.75V18.6c4.2-.15 6.2.3 8 1.4zM12.75 6.1C14.3 5 16.4 4.6 20.75 4.75V18.6c-4.2-.15-6.2.3-8 1.4z",
  },
  {
    key: "market",
    outline:
      "M7.5 3.5v3.5M7.5 16v4.5M16.5 3.5v6M16.5 16.5v4M6 7h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM15 9.5h3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1z",
    filled:
      "M6 7h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM15 9.5h3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1zM6.75 3h1.5v4h-1.5zM6.75 16h1.5v5h-1.5zM15.75 3h1.5v6.5h-1.5zM15.75 16.5h1.5v4.5h-1.5z",
  },
];

export const scopeEmoji = (scope: TabBarScope): string => (scope === "household" ? "🏠" : "👤");
