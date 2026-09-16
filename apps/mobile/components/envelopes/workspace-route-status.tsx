import { ActivityIndicator } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import type { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";

import { styles } from "./styles";

interface WorkspaceRouteStatusProps {
  action?: ReactNode;
  title?: string;
  message?: string;
  loadingLabel?: string;
}

export const WorkspaceRouteStatus = ({
  action,
  title,
  message,
  loadingLabel,
}: WorkspaceRouteStatusProps) => {
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[styles.screenFlexCenter, { paddingTop: insets.top }]}
    >
      {loadingLabel ? <ActivityIndicator accessibilityLabel={loadingLabel} /> : null}
      {title ? <Text style={styles.textSemiboldInk}>{title}</Text> : null}
      {message ? (
        <Text selectable style={styles.textCenterNormalSmInk60}>
          {message}
        </Text>
      ) : null}
      {action}
    </Animated.View>
  );
};
