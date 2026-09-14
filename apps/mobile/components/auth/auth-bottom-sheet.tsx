import { Children, cloneElement, useState, type ReactElement, type ReactNode } from "react";
import type { PressableProps } from "react-native";
import { View } from "react-native";

import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";

export function AuthBottomSheet({
  trigger,
  children,
  isPresented: presentedProp,
  onDismiss,
}: {
  trigger?: ReactNode;
  children: ReactNode;
  isPresented?: boolean;
  onDismiss?: () => void;
}) {
  const [uncontrolledPresented, setUncontrolledPresented] = useState(false);
  const isControlled = presentedProp !== undefined;
  const isPresented = isControlled ? presentedProp : uncontrolledPresented;

  const handleDismiss = () => {
    if (!isControlled) setUncontrolledPresented(false);
    onDismiss?.();
  };

  const renderTrigger = () => {
    if (!trigger) return null;
    const child = Children.only(trigger);
    // SAFETY: Children.only guarantees one element; we only replace onPress.
    return cloneElement(child as ReactElement<PressableProps>, {
      onPress: () => {
        if (!isControlled) setUncontrolledPresented(true);
      },
    });
  };

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet open={isPresented} onDismiss={handleDismiss} testID="auth-bottom-sheet">
        <View className="p-6">{children}</View>
      </ModalBottomSheet>
    </>
  );
}
