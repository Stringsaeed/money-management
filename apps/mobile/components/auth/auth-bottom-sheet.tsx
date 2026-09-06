import { BottomSheet } from "@expo/ui";
import { Children, cloneElement, useState, type ReactElement, type ReactNode } from "react";
import type { PressableProps } from "react-native";
import { useNativeVariable } from "react-native-css/native";

import { AuthSurfaceProvider } from "@/components/auth/ui";

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
  const bgSurface = useNativeVariable("--color-surface");

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
      <BottomSheet
        snapPoints={["half"]}
        isPresented={isPresented}
        onDismiss={handleDismiss}
        containerColor={bgSurface}
        contentPadding={{ top: 24, bottom: 24, left: 24, right: 24 }}
      >
        <AuthSurfaceProvider surface="sheet">{children}</AuthSurfaceProvider>
      </BottomSheet>
    </>
  );
}
