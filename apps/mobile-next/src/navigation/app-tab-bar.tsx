import { router, type Tabs } from "expo-router";
import type { V2LedgerScope } from "@trove/api/v2/contracts";
import { useState, type ComponentProps } from "react";

import { useSession } from "@/features/auth/use-session";
import { useHousehold } from "@/features/household/use-household";
import {
  CreateActionSheet,
  type CreateAction,
  ScopeControl,
  ScopeSheet,
} from "@/features/navigation";
import { GlassTabBar } from "@/ui/glass-tab-bar";

import { useLedgerScope } from "./ledger-scope-context";

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

export const AppTabBar = ({ state, navigation, descriptors, insets }: BottomTabBarProps) => {
  const { scope, selectScope } = useLedgerScope();
  const session = useSession();
  const [createOpen, setCreateOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const household = useHousehold(session.status === "signed_in" && scopeOpen);

  const scopeLabel =
    scope.kind === "household" ? (household.household?.name ?? "Household") : "Personal";
  const selectCreateAction = (action: CreateAction) => {
    setCreateOpen(false);
    const navigate = () => {
      if (action === "category") {
        router.push({ pathname: "/categories", params: { create: "1" } });
        return;
      }
      const paths = {
        transaction: "/transactions/new",
        account: "/accounts/new",
      } as const satisfies Record<Exclude<CreateAction, "category">, string>;
      router.push(paths[action]);
    };
    setTimeout(navigate, 0);
  };
  const selectLedgerScope = (nextScope: V2LedgerScope) => {
    selectScope(nextScope);
    setScopeOpen(false);
  };

  return (
    <>
      <GlassTabBar
        state={state}
        navigation={navigation}
        insets={insets}
        descriptors={descriptors}
        createAccessibilityLabel="Create"
        onCreate={() => router.push("/transactions/new")}
        onCreateLongPress={() => setCreateOpen(true)}
        scopeControl={<ScopeControl label={scopeLabel} onPress={() => setScopeOpen(true)} />}
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
