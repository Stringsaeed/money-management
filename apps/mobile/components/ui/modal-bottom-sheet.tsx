import React from "react";
import {
  ModalBottomSheet as NativeModalBottomSheet,
  type ModalBottomSheetProps as NativeModalBottomSheetProps,
} from "@swmansion/react-native-bottom-sheet";
import { View } from "react-native";

export interface ModalBottomSheetProps extends Omit<
  NativeModalBottomSheetProps,
  "index" | "onIndexChange" | "scrimColor" | "surface"
> {
  open: boolean;
  onDismiss: VoidFunction;
  scrimColor?: NativeModalBottomSheetProps["scrimColor"];
  surface?: NativeModalBottomSheetProps["surface"];
  testID?: string;
}

/**
 * App-owned lifecycle boundary for modal sheets.
 *
 * The native sheet is mounted only while open. A native snap to its closed
 * detent is reported through the app's single dismissal callback, allowing
 * the owner to clear its open state and unmount the portal.
 */
export function ModalBottomSheet({
  open,
  onDismiss,
  scrimColor = "rgba(0, 0, 0, 0.5)",
  surface = <View className="absolute inset-0 rounded-t-3xl bg-background" />,
  testID,
  children,
  ...props
}: ModalBottomSheetProps) {
  if (!open) return null;

  return (
    <NativeModalBottomSheet
      {...props}
      index={1}
      onIndexChange={(index) => {
        if (index === 0) onDismiss();
      }}
      scrimColor={scrimColor}
      surface={surface}
    >
      {testID ? <View testID={testID}>{children}</View> : children}
    </NativeModalBottomSheet>
  );
}
