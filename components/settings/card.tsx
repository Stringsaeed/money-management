import { View } from "react-native";
import Animated from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";

interface CardProps {
  children: React.ReactNode;
  animated?: boolean;
}

export function Card({ children, animated }: CardProps) {
  const Component = animated ? Animated.View : View;

  return (
    <Component
      layout={animated ? layoutTransition : undefined}
      className="bg-surface-container mx-5 mt-4 overflow-hidden"
      style={{ borderCurve: "continuous" }}
    >
      {children}
    </Component>
  );
}
