import type { ComponentProps } from "react";
import { router, type Tabs } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { TabBar } from "@/ui/tab-bar";

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

export const AppTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const queryClient = useQueryClient();
  const selected = state.routes[state.index]?.name ?? "index";
  const select = (key: string) => {
    const name = key === "home" ? "index" : key;
    const route = state.routes.find((item) => item.name === name);
    if (!route) return;
    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) {
      // Refresh visible API-backed collections when returning to a tab.
      void queryClient
        .invalidateQueries({ queryKey: ["v2"], refetchType: "active" })
        .catch(() => undefined);
      if (selected !== name) navigation.navigate(name);
    }
  };
  return (
    <TabBar
      activeKey={selected === "index" ? "home" : selected}
      onSelect={select}
      onCreate={() => router.push("/transactions/new")}
      createAccessibilityLabel="Add transaction"
    />
  );
};
