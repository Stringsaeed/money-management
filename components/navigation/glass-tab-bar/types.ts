import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";

export type GlassTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];
