import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { TabBar } from "../tab-bar";
import { indicatorOffset, scopeButtonLabel, tabBarLayout, tabHitSlop, tabWidthFor } from "../utils";
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

describe("TabBar v2", () => {
  const v2Tabs = (active: TabBarTab["key"]): TabBarTab[] => [
    { key: "home", label: "Home", active: active === "home" },
    { key: "ledger", label: "Ledger", active: active === "ledger" },
    { key: "market", label: "Market", active: active === "market" },
    { key: "settings", label: "Settings", active: active === "settings" },
  ];

  it("renders and reports the market tab", async () => {
    const onTabPress = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={METRICS}>
        <TabBar onAdd={jest.fn()} onTabPress={onTabPress} tabs={v2Tabs("market")} />
      </SafeAreaProvider>,
    );
    expect(screen.getByRole("tab", { name: "Market" }).props.accessibilityState).toEqual({
      selected: true,
    });
    await fireEvent.press(screen.getByRole("tab", { name: "Home" }));
    await fireEvent.press(screen.getByRole("tab", { name: "Market" }));
    expect(onTabPress).toHaveBeenLastCalledWith("market");
  });

  it("shows the scope button instead of Accounts and fires onScopePress", async () => {
    const onScopePress = jest.fn();
    await renderBar({ onAccounts: undefined, onScopePress, scope: "personal" });
    expect(screen.queryByRole("button", { name: "Accounts" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Scope: Personal" }));
    expect(onScopePress).toHaveBeenCalledTimes(1);
  });

  it("names the household scope and reports the open menu", async () => {
    await renderBar({
      onAccounts: undefined,
      onScopePress: jest.fn(),
      scope: "household",
      scopeExpanded: true,
    });
    const button = screen.getByRole("button", { name: "Scope: Household" });
    expect(button.props.accessibilityState).toEqual({ expanded: true });
  });

  it("can show Accounts and the scope button together", async () => {
    await renderBar({ onScopePress: jest.fn() });
    expect(screen.getByRole("button", { name: "Accounts" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Scope: Personal" })).toBeTruthy();
  });
});

describe("tab bar layout", () => {
  it("labels the scope button by scope", () => {
    expect(scopeButtonLabel("personal")).toBe("Scope: Personal");
    expect(scopeButtonLabel("household")).toBe("Scope: Household");
  });

  it("gives tabs more room with fewer round buttons and never drops below 44pt", () => {
    expect(tabWidthFor(375, 4, 1)).toBe(56);
    expect(tabWidthFor(375, 4, 3)).toBe(40);
  });

  it("uses 56pt tabs on a 390pt screen and shrinks on narrow ones, down to 40pt", () => {
    expect(tabWidthFor(390, 4)).toBe(56);
    expect(tabWidthFor(1024, 4)).toBe(56);
    expect(tabWidthFor(375, 4)).toBe(52);
    expect(tabWidthFor(280, 4)).toBe(40);
    // A 320pt screen fits four 40pt tabs, scope and Add with the compact gap.
    expect(tabBarLayout(320, 4)).toEqual({ tabWidth: 40, sideGap: 6 });
    expect(tabHitSlop(40)).toBe(2);
  });

  it("slides the indicator one tab plus the 2pt gap per step", () => {
    expect(indicatorOffset(0, 56)).toBe(0);
    expect(indicatorOffset(2, 56)).toBe(116);
    expect(indicatorOffset(-1, 56)).toBe(0);
  });
});
