import { buildTabEntries } from "../tab-bar-routes";

describe("buildTabEntries", () => {
  const routes = [
    { key: "(home)-1", name: "(home)" },
    { key: "ledger-1", name: "ledger" },
    { key: "market-1", name: "market" },
    { key: "settings-1", name: "settings" },
    { key: "hidden-1", name: "somewhere-else" },
  ];

  it("maps tab routes to Trove keys, marks the focused one and skips unknown routes", () => {
    const entries = buildTabEntries({
      routes,
      focusedKey: "market-1",
      labelFor: (route) => route.name,
    });

    expect(entries.map((entry) => entry.tab.key)).toEqual(["home", "ledger", "market", "settings"]);
    expect(entries.map((entry) => entry.tab.active)).toEqual([false, false, true, false]);
    expect(entries[0]?.route.name).toBe("(home)");
  });
});
