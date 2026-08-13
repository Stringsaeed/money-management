import { View, type ViewStyle } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

import type { UseAccountFormReturn } from "./form";

interface AccountFormSheetFooterProps {
  error?: string;
  form: UseAccountFormReturn;
  footerStyle?: ViewStyle;
  onSubmit: VoidFunction;
}

export function AccountFormSheetFooter({ error, form, onSubmit }: AccountFormSheetFooterProps) {
  return (
    <View className="gap-3 p-5">
      {error ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={layoutTransition}
        >
          <Text className="text-center font-body-medium text-sm text-destructive">{error}</Text>
        </Animated.View>
      ) : null}

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button disabled={isSubmitting} onPress={onSubmit} size="lg">
            <Text className="font-body-semibold text-base text-surface">
              {isSubmitting ? "Creating…" : "Create Account"}
            </Text>
          </Button>
        )}
      </form.Subscribe>
    </View>
  );
}
