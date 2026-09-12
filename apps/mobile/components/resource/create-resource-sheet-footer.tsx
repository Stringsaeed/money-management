import { Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface CreateResourceSheetFooterProps {
  error?: string;
  isSubmitting: boolean;
  onSubmit: VoidFunction;
  submitLabel: string;
  submittingLabel?: string;
}

/**
 * RN Pressable submit (same control path as #253 personal-upload confirm that
 * PASSed agent-device). #255 NativeHost stayed AX-hittable but ModalBottomSheet
 * pan chrome still cancelled presses; combined with programmatic closed detent
 * on the sheet so pan cannot begin while open.
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
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isSubmitting }}
        disabled={isSubmitting}
        onPress={onSubmit}
        testID="create-resource-submit"
        className={cn(
          "min-h-12 items-center justify-center rounded-xl bg-ink px-4 py-3 active:opacity-80",
          isSubmitting && "opacity-50",
        )}
      >
        <Text className="font-body-semibold text-base text-surface">
          {isSubmitting ? submittingLabel : submitLabel}
        </Text>
      </Pressable>
    </View>
  );
}
