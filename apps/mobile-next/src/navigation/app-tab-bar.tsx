import { router, type Tabs } from "expo-router";
import type { V2LedgerScope } from "@trove/api/v2/contracts";
import { useState, type ComponentProps } from "react";

import { useSession } from "@/features/auth/use-session";
import { useHousehold } from "@/features/household/use-household";
import { CreateActionSheet, type CreateAction, ScopeSheet } from "@/features/navigation";
import { playCue } from "@/features/sound";
import { TabBar, type TabBarKey } from "@/ui/trove";

import { useLedgerScope } from "./ledger-scope-context";
import { buildTabEntries } from "./tab-bar-routes";

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

export const AppTabBar = ({ state, navigation, descriptors }: BottomTabBarProps) => {
  const { scope, selectScope } = useLedgerScope();
  const session = useSession();
  const [createOpen, setCreateOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const household = useHousehold(session.status === "signed_in" && scopeOpen);

  const entries = buildTabEntries({
    routes: state.routes,
    focusedKey: state.routes[state.index]?.key,
    labelFor: (route) => descriptors[route.key]?.options.title ?? route.name,
  });
  const scopeLabel =
    scope.kind === "household" ? (household.household?.name ?? "Household") : "Personal";

  const pressTab = (key: TabBarKey) => {
    const entry = entries.find((candidate) => candidate.tab.key === key);
    if (!entry) return;
    const event = navigation.emit({
      type: "tabPress",
      target: entry.route.key,
      canPreventDefault: true,
    });
    if (!entry.tab.active && !event.defaultPrevented) navigation.navigate(entry.route.name);
  };
  const selectCreateAction = (action: CreateAction) => {
    setCreateOpen(false);
    const paths = {
      transaction: "/transactions/new",
      account: "/accounts/new",
      category: "/categories/new",
    } as const satisfies Record<CreateAction, string>;
    // Let the sheet finish closing so the editor isn't presented underneath it.
    setTimeout(() => router.push(paths[action]), 0);
  };
  const selectLedgerScope = (nextScope: V2LedgerScope) => {
    selectScope(nextScope);
    playCue("toggle");
    setScopeOpen(false);
  };

  return (
    <>
      <TabBar
        addLabel="Create"
        onAdd={() => router.push("/transactions/new")}
        onAddLongPress={() => setCreateOpen(true)}
        onScopePress={() => setScopeOpen(true)}
        onTabPress={pressTab}
        scope={scope.kind}
        scopeExpanded={scopeOpen}
        scopeLabel={`Ledger scope: ${scopeLabel}`}
        tabs={entries.map((entry) => entry.tab)}
      />
      <CreateActionSheet
        open={createOpen}
        onDismiss={() => setCreateOpen(false)}
        onSelect={selectCreateAction}
      />
      <ScopeSheet
        open={scopeOpen}
        onDismiss={() => setScopeOpen(false)}
        scope={scope}
        household={household.household}
        loading={household.loading}
        error={household.error}
        onSelect={selectLedgerScope}
        onOpenHousehold={() => {
          setScopeOpen(false);
          router.push("/household");
        }}
      />
    </>
  );
};
