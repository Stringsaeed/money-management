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

  it("leaves hidden routes out of the bar", () => {
    const entries = buildTabEntries({
      routes: [...routes, { key: "envelopes-1", name: "envelopes" }],
      focusedKey: undefined,
      labelFor: (route) => route.name,
      hiddenRoutes: ["envelopes", "market"],
    });

    expect(entries.map((entry) => entry.route.name)).toEqual(["(home)", "ledger", "settings"]);
  });
});
