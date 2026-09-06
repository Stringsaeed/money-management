import { BottomSheet } from "@expo/ui";
import { Children, cloneElement, useState, type ReactElement, type ReactNode } from "react";
import type { PressableProps } from "react-native";
import { useNativeVariable } from "react-native-css/native";

import { AuthSurfaceProvider } from "@/components/auth/ui";

export function AuthBottomSheet({
  trigger,
  children,
}: {
  trigger: ReactNode;
  children: ReactNode;
}) {
  const [isPresented, setIsPresented] = useState(false);
  const bgSurface = useNativeVariable("--color-surface");
  const onOpen = () => setIsPresented(true);

  const renderTrigger = () => {
    if (!trigger) return null;
    const child = Children.only(trigger);
    // SAFETY: Children.only guarantees one element; we only replace onPress.
    return cloneElement(child as ReactElement<PressableProps>, {
      onPress: onOpen,
    });
  };

  return (
    <>
      {renderTrigger()}
      <BottomSheet
        snapPoints={["half"]}
        isPresented={isPresented}
        onDismiss={() => setIsPresented(false)}
        containerColor={bgSurface}
        contentPadding={{ top: 24, bottom: 24, left: 24, right: 24 }}
      >
        <AuthSurfaceProvider surface="sheet">{children}</AuthSurfaceProvider>
      </BottomSheet>
    </>
  );
}
