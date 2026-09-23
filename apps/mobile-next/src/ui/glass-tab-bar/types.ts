import type { Tabs } from "expo-router";
import type { ComponentProps, ReactNode } from "react";

type ExpoTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

export interface GlassTabBarActions {
  readonly onCreate?: () => void;
  readonly onCreateLongPress?: () => void;
  readonly createAccessibilityLabel?: string;
  readonly scopeControl?: ReactNode;
}

export type GlassTabBarProps = ExpoTabBarProps & GlassTabBarActions;
