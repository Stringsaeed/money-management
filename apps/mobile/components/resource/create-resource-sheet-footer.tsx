import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { NativeHost, NativePrimaryButton } from "@/components/native-ui";
import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";

interface CreateResourceSheetFooterProps {
  error?: string;
  isSubmitting: boolean;
  onSubmit: VoidFunction;
  submitLabel: string;
  submittingLabel?: string;
}

/**
 * Primary submit uses Expo UI NativeHost button (not RN Pressable): #254 made
 * Create Account AX-hittable inside ModalBottomSheet, but sheet gesture/chrome
 * still swallowed Pressable onPress (coord + testID miss). NativeHost primary
 * matches the sign-out sheet pattern that does receive taps in this portal.
 */
export function CreateResourceSheetFooter({
  error,
  isSubmitting,
  onSubmit,
  submitLabel,
  submittingLabel = "Creating…",
}: CreateResourceSheetFooterProps) {
  return (
    <View className="gap-3 p-5" collapsable={false}>
      {error ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={layoutTransition}
        >
          <Text className="text-center font-body-medium text-sm text-destructive">{error}</Text>
        </Animated.View>
      ) : null}
      <NativeHost>
        <NativePrimaryButton
          disabled={isSubmitting}
          label={isSubmitting ? submittingLabel : submitLabel}
          onPress={onSubmit}
          testID="create-resource-submit"
        />
      </NativeHost>
    </View>
  );
}
