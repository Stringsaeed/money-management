import React from "react";
import type { PressableProps } from "react-native";
import { Pressable, ScrollView, View } from "react-native";
import { XIcon } from "phosphor-react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";

interface CreateResourceBottomSheetProps {
  autoPresent?: boolean;
  children?: React.ReactElement<PressableProps>;
  content: React.ReactNode;
  footer: React.ReactNode;
  headerRight?: React.ReactNode;
  onDismiss?: VoidFunction;
  title: string;
}

export interface CreateResourceBottomSheetRef {
  dismiss: VoidFunction;
}

export const CreateResourceBottomSheet = React.forwardRef<
  CreateResourceBottomSheetRef,
  CreateResourceBottomSheetProps
>(function CreateResourceBottomSheet(
  { autoPresent = false, children, content, footer, headerRight, onDismiss, title },
  ref,
) {
  const [index, setIndex] = React.useState(autoPresent ? 1 : 0);
  const didDismissRef = React.useRef(false);

  function handleIndexChange(nextIndex: number) {
    setIndex(nextIndex);
    if (nextIndex > 0) {
      didDismissRef.current = false;
      return;
    }

    if (didDismissRef.current) return;

    didDismissRef.current = true;
    onDismiss?.();
  }

  React.useImperativeHandle(ref, () => ({
    dismiss: () => handleIndexChange(0),
  }));

  function renderTrigger() {
    if (!children) return null;

    return React.cloneElement(children, {
      onPress: (event) => {
        handleIndexChange(1);
        children.props.onPress?.(event);
      },
    });
  }

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet
        scrimColor="rgba(0, 0, 0, 0.5)"
        index={index}
        onIndexChange={handleIndexChange}
      >
        <View className="mx-4 mb-safe flex-1 rounded-3xl overflow-hidden bg-background">
          <View className="flex-row items-center px-3 py-3">
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-dim"
              hitSlop={8}
              onPress={() => handleIndexChange(0)}
            >
              <Icon as={XIcon} size={20} className="text-ink" />
            </Pressable>
            <Text className="flex-1 text-center font-heading-normal text-xl italic text-ink">
              {title}
            </Text>
            {headerRight ?? <View className="h-10 w-10" />}
          </View>
          <ScrollView contentContainerClassName="gap-4 px-5 py-4 pb-8">{content}</ScrollView>
          <View className="bg-background">{footer}</View>
        </View>
      </ModalBottomSheet>
    </>
  );
});
