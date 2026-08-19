import { ActivityIndicator } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

interface SetupDraftRouteStatusProps {
  error?: boolean;
  onDiscard?: VoidFunction;
}

export const SetupDraftRouteStatus = ({ error, onDiscard }: SetupDraftRouteStatusProps) => (
  <Animated.View
    entering={FadeIn}
    exiting={FadeOut}
    layout={LinearTransition}
    className="flex-1 items-center justify-center gap-3 bg-surface px-5 safe-top safe-bottom"
  >
    {error ? (
      <>
        <Text className="font-body-semibold text-ink">Setup Draft is unreadable</Text>
        <Text selectable className="text-center font-body-normal text-sm text-ink/60">
          The saved plan cannot be resumed. Discard only this draft, then start setup again.
        </Text>
        <Button accessibilityLabel="Discard unreadable Setup Draft" onPress={onDiscard}>
          <Text>Discard unreadable Setup Draft</Text>
        </Button>
      </>
    ) : (
      <ActivityIndicator accessibilityLabel="Loading Setup Draft" />
    )}
  </Animated.View>
);
