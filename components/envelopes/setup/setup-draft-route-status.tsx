import { ActivityIndicator } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

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
  const unreadable = status === "unreadable";
  const unavailable = status === "unavailable";
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      layout={LinearTransition}
      className="flex-1 items-center justify-center gap-3 bg-surface px-5 safe-top safe-bottom"
    >
      {status === "loading" ? <ActivityIndicator accessibilityLabel="Loading Setup Draft" /> : null}
      {unreadable ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={LinearTransition}
          className="gap-3"
        >
          <Text className="text-center font-body-semibold text-ink">Setup Draft is unreadable</Text>
          <Text selectable className="text-center font-body-normal text-sm text-ink/60">
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
          className="gap-3"
        >
          <Text className="text-center font-body-semibold text-ink">Setup data is unavailable</Text>
          <Text selectable className="text-center font-body-normal text-sm text-ink/60">
            Accounts or Categories could not be loaded. Check local storage, then retry.
          </Text>
          <Button accessibilityLabel="Retry loading Setup Draft" onPress={onRetry}>
            <Text>Retry</Text>
          </Button>
        </Animated.View>
      ) : null}
      {actionError ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
          <Text selectable className="text-center font-body-medium text-sm text-destructive">
            {actionError}
          </Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};
