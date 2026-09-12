import React from "react";
import type { PressableProps } from "react-native";
import { Pressable, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { XIcon } from "phosphor-react-native";
import { ModalBottomSheet, programmatic } from "@swmansion/react-native-bottom-sheet";

import { Icon } from "@/components/ui/icon";
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

/**
 * Closed detent is programmatic-only so the sheet pan recognizer has a single
 * snap candidate while open. That is the SM-bottom-sheet equivalent of
 * enableContentPanningGesture={false}: pan never begins, so it cannot
 * cancelTouchesInView / flip RCTSurfaceTouchHandler mid-press on Create Account.
 * Library has no footer slot; sticky footer stays outside RNGH ScrollView.
 */
export function CreateResourceBottomSheet({
  autoPresent = false,
  children,
  content,
  footer,
  headerRight,
  onDismiss,
  title,
}: CreateResourceBottomSheetProps) {
  const [index, setIndex] = React.useState(autoPresent ? 1 : 0);

  function handleIndexChange(nextIndex: number) {
    setIndex(nextIndex);
    if (nextIndex === 0) onDismiss?.();
  }

  function renderTrigger() {
    if (!children) return null;

    return React.cloneElement(children, {
      onPress: (event) => {
        setIndex(1);
        children.props.onPress?.(event);
      },
    });
  }

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet
        detents={[programmatic(0), "content"]}
        disableScrollableNegotiation
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
          {/* flex-1 keeps the scroll region from expanding over the sticky footer hit target */}
          <ScrollView
            className="flex-1"
            contentContainerClassName="grow gap-4 px-5 py-4 pb-8"
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
          {/* Sticky submit outside scroll gesture content (no library footer prop). */}
          <View className="z-10 border-t border-ledger-outline bg-background" collapsable={false}>
            {footer}
          </View>
        </View>
      </ModalBottomSheet>
    </>
  );
}
