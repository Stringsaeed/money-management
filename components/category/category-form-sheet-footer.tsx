import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

import type { UseCategoryFormReturn } from "./form";

interface CategoryFormSheetFooterProps {
  error?: string;
  form: UseCategoryFormReturn;
  onSubmit: VoidFunction;
}

export function CategoryFormSheetFooter({ error, form, onSubmit }: CategoryFormSheetFooterProps) {
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
          <Button
            className="w-full"
            disabled={isSubmitting}
            onPress={onSubmit}
            size="lg"
            variant="default"
          >
            <Text className="font-body-semibold text-base text-surface">
              {isSubmitting ? "Creating…" : "Create Category"}
            </Text>
          </Button>
        )}
      </form.Subscribe>
    </View>
  );
}
