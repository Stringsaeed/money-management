import type { PropsWithChildren } from "react";
import { View, type ViewProps } from "react-native";

export function GlassView({ children, ...props }: PropsWithChildren<ViewProps>) {
  return <View {...props}>{children}</View>;
}

export const isLiquidGlassAvailable = () => false;

export const isGlassEffectAPIAvailable = () => false;

export function GlassContainer({ children, ...props }: PropsWithChildren<ViewProps>) {
  return <View {...props}>{children}</View>;
}
