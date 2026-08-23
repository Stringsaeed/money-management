import { ActivityIndicator } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { Text } from "@/components/ui/text";

interface WorkspaceRouteStatusProps {
  title?: string;
  message?: string;
  loadingLabel?: string;
}

export const WorkspaceRouteStatus = ({
  title,
  message,
  loadingLabel,
}: WorkspaceRouteStatusProps) => (
  <Animated.View
    entering={FadeIn}
    exiting={FadeOut}
    className="flex-1 items-center justify-center gap-2 bg-surface px-5 pt-safe"
  >
    {loadingLabel ? <ActivityIndicator accessibilityLabel={loadingLabel} /> : null}
    {title ? <Text className="font-body-semibold text-ink">{title}</Text> : null}
    {message ? (
      <Text selectable className="text-center font-body-normal text-sm text-ink/60">
        {message}
      </Text>
    ) : null}
  </Animated.View>
);
