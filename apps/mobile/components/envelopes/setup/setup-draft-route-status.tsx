import { ActivityIndicator } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { styles } from "@/components/envelopes/styles";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

interface SetupDraftRouteStatusProps {
  actionError?: string | null;
  onDiscard?: VoidFunction;
  onRetry?: VoidFunction;
  status?: "loading" | "unavailable" | "unreadable";
}

export const SetupDraftRouteStatus = ({
  actionError,
  onDiscard,
  onRetry,
  status = "loading",
}: SetupDraftRouteStatusProps) => {
  const insets = useSafeAreaInsets();
  const unreadable = status === "unreadable";
  const unavailable = status === "unavailable";
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      layout={LinearTransition}
      style={[
        styles.screenFlexCenterGap3,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {status === "loading" ? <ActivityIndicator accessibilityLabel="Loading Setup Draft" /> : null}
      {unreadable ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={LinearTransition}
          style={styles.routeStatusGap3}
        >
          <Text style={styles.textCenterSemiboldInk}>Setup Draft is unreadable</Text>
          <Text selectable style={styles.textCenterNormalSmInk60}>
            The saved plan cannot be resumed. Discard only this draft, then start setup again.
          </Text>
          <Button accessibilityLabel="Discard unreadable Setup Draft" onPress={onDiscard}>
            <Text>Discard unreadable Setup Draft</Text>
          </Button>
        </Animated.View>
      ) : null}
      {unavailable ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={LinearTransition}
          style={styles.routeStatusGap3}
        >
          <Text style={styles.textCenterSemiboldInk}>Setup data is unavailable</Text>
          <Text selectable style={styles.textCenterNormalSmInk60}>
            Accounts or Categories could not be loaded. Check local storage, then retry.
          </Text>
          <Button accessibilityLabel="Retry loading Setup Draft" onPress={onRetry}>
            <Text>Retry</Text>
          </Button>
        </Animated.View>
      ) : null}
      {actionError ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
          <Text selectable style={[styles.textDestructive, { textAlign: "center" }]}>
            {actionError}
          </Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};
