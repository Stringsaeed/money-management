import React from "react";
import type { PressableProps } from "react-native";
import { Pressable, ScrollView, View } from "react-native";
import { XIcon } from "phosphor-react-native";

import { Icon } from "@/components/ui/icon";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";

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
  const [open, setOpen] = React.useState(autoPresent);

  function handleDismiss() {
    setOpen(false);
    onDismiss?.();
  }

  React.useImperativeHandle(ref, () => ({
    dismiss: handleDismiss,
  }));

  function renderTrigger() {
    if (!children) return null;

    return React.cloneElement(children, {
      onPress: (event) => {
        setOpen(true);
        children.props.onPress?.(event);
      },
    });
  }

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet open={open} onDismiss={handleDismiss}>
        <View className="mx-4 mb-safe flex-1 rounded-3xl overflow-hidden bg-background">
          <View className="flex-row items-center px-3 py-3">
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-dim"
              hitSlop={8}
              onPress={handleDismiss}
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
