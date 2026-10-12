import { fireEvent, render, screen } from "@testing-library/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { TabBar } from "../tab-bar";
import { indicatorOffset, tabBarLayout, tabHitSlop } from "../utils";
import type { TabBarTab } from "../types";

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const tabs = (active: TabBarTab["key"]): TabBarTab[] => [
  { key: "home", label: "Home", active: active === "home" },
  { key: "budget", label: "Budget", active: active === "budget" },
  { key: "ledger", label: "Ledger", active: active === "ledger" },
  { key: "market", label: "Market", active: active === "market", badge: true },
];

async function renderBar(overrides: Partial<React.ComponentProps<typeof TabBar>> = {}) {
  const handlers = { onTabPress: jest.fn(), onAdd: jest.fn() };
  await render(
    <GestureHandlerRootView>
      <SafeAreaProvider initialMetrics={METRICS}>
        <TabBar tabs={tabs("ledger")} {...handlers} {...overrides} />
      </SafeAreaProvider>
    </GestureHandlerRootView>,
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
    await fireEvent.press(screen.getByRole("tab", { name: "Budget" }));
    expect(onTabPress).toHaveBeenLastCalledWith("budget");
    await fireEvent.press(screen.getByRole("tab", { name: "Ledger" }));
    expect(onTabPress).toHaveBeenLastCalledWith("ledger");
  });

  it("injects the Add action as a labelled button", async () => {
    const { onAdd } = await renderBar();
    await fireEvent.press(screen.getByRole("button", { name: "Add spending" }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("supports a long press on Add", async () => {
    const onAddLongPress = jest.fn();
    await renderBar({ onAddLongPress });
    await fireEvent(screen.getByRole("button", { name: "Add spending" }), "longPress");
    expect(onAddLongPress).toHaveBeenCalledTimes(1);
  });

  it("allows custom labels for localisation", async () => {
    await renderBar({ addLabel: "Buchung hinzufügen" });
    expect(screen.getByRole("button", { name: "Buchung hinzufügen" })).toBeTruthy();
  });
});

describe("TabBar scope button", () => {
  it("fires onScopePress", async () => {
    const onScopePress = jest.fn();
    await renderBar({ onScopePress, scope: "personal" });
    await fireEvent.press(
      screen.getByRole("button", { name: "Personal budget. Switch ledger or open settings" }),
    );
    expect(onScopePress).toHaveBeenCalledTimes(1);
  });

  it("names the household scope and reports the open menu", async () => {
    await renderBar({ onScopePress: jest.fn(), scope: "household", scopeExpanded: true });
    const button = screen.getByRole("button", {
      name: "Household budget. Switch ledger or open settings",
    });
    expect(button.props.accessibilityState).toEqual({ expanded: true });
  });
});

describe("tab bar layout", () => {
  it("shrinks tabs on narrow screens, down to 40pt", () => {
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
