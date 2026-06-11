import { View } from "react-native";
import Animated from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";

import { useElevatedSurfaceStyle } from "./use-elevated-surface-style";

interface CardProps {
  children: React.ReactNode;
  animated?: boolean;
}

export function Card({ children, animated }: CardProps) {
  const Component = animated ? Animated.View : View;
  const elevatedSurfaceStyle = useElevatedSurfaceStyle();

  return (
    <Component
      layout={animated ? layoutTransition : undefined}
      className="bg-surface-container mx-5 mt-4"
      style={elevatedSurfaceStyle}
    >
      {children}
    </Component>
  );
}
