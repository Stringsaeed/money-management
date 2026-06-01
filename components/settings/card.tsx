import { StyleSheet, View } from "react-native";
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
      className="bg-surface-container mx-5 mt-4"
      style={{
        borderCurve: "circular",
        boxShadow: "2px 2px 0px -1.5px rgba(0,0,0,0.01)",
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(0,0,0,0.1)",
      }}
    >
      {children}
    </Component>
  );
}
