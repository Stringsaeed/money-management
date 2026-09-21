import type { PropsWithChildren } from "react";
import { View, type ViewProps } from "react-native";

interface EaseViewMockProps extends ViewProps {
  animate?: {
    opacity?: number;
    scale?: number;
    translateX?: number;
    translateY?: number;
    backgroundColor?: string;
  };
  initialAnimate?: EaseViewMockProps["animate"];
  transition?: {
    type?: "none" | "timing" | "spring";
    duration?: number;
    easing?: string;
  };
}

export function EaseView({
  animate: _animate,
  initialAnimate: _initialAnimate,
  transition: _transition,
  children,
  ...props
}: PropsWithChildren<EaseViewMockProps>) {
  return <View {...props}>{children}</View>;
}
