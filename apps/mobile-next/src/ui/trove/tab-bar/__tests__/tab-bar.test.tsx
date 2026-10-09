import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { TabBar } from "../tab-bar";
import { tabWidthFor, indicatorOffset } from "../utils";
import type { TabBarTab } from "../types";

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const tabs = (active: TabBarTab["key"]): TabBarTab[] => [
  { key: "home", label: "Home", active: active === "home" },
  { key: "ledger", label: "Ledger", active: active === "ledger" },
  { key: "insights", label: "Insights", active: active === "insights" },
  { key: "settings", label: "Settings", active: active === "settings", badge: true },
];

async function renderBar(overrides: Partial<React.ComponentProps<typeof TabBar>> = {}) {
  const handlers = { onTabPress: jest.fn(), onAccounts: jest.fn(), onAdd: jest.fn() };
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <TabBar tabs={tabs("ledger")} {...handlers} {...overrides} />
    </SafeAreaProvider>,
  );
  return handlers;
}

describe("TabBar", () => {
  it("exposes a tablist of labelled tabs with selected state", async () => {
    await renderBar();
    expect(screen.getByLabelText("Main").props.accessibilityRole).toBe("tablist");
    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(screen.getByRole("tab", { name: "Ledger" }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByRole("tab", { name: "Home" }).props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it("reports the pressed tab, including a re-tap of the active one", async () => {
    const { onTabPress } = await renderBar();
    await fireEvent.press(screen.getByRole("tab", { name: "Insights" }));
    expect(onTabPress).toHaveBeenLastCalledWith("insights");
    await fireEvent.press(screen.getByRole("tab", { name: "Ledger" }));
    expect(onTabPress).toHaveBeenLastCalledWith("ledger");
  });

  it("injects the Accounts and Add actions as labelled buttons", async () => {
    const { onAccounts, onAdd } = await renderBar();
    await fireEvent.press(screen.getByRole("button", { name: "Accounts" }));
    await fireEvent.press(screen.getByRole("button", { name: "Add transaction" }));
    expect(onAccounts).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("supports a long press on Add", async () => {
    const onAddLongPress = jest.fn();
    await renderBar({ onAddLongPress });
    await fireEvent(screen.getByRole("button", { name: "Add transaction" }), "longPress");
    expect(onAddLongPress).toHaveBeenCalledTimes(1);
  });

  it("allows custom labels for localisation", async () => {
    await renderBar({ accountsLabel: "Konten", addLabel: "Buchung hinzufügen" });
    expect(screen.getByRole("button", { name: "Konten" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Buchung hinzufügen" })).toBeTruthy();
  });
});

describe("tab bar layout", () => {
  it("uses 56pt tabs on a 390pt screen and shrinks on narrow ones, never below 44pt", () => {
    expect(tabWidthFor(390, 4)).toBe(56);
    expect(tabWidthFor(1024, 4)).toBe(56);
    expect(tabWidthFor(375, 4)).toBe(52);
    expect(tabWidthFor(280, 4)).toBe(44);
  });

  it("slides the indicator one tab plus the 2pt gap per step", () => {
    expect(indicatorOffset(0, 56)).toBe(0);
    expect(indicatorOffset(2, 56)).toBe(116);
    expect(indicatorOffset(-1, 56)).toBe(0);
  });
});
