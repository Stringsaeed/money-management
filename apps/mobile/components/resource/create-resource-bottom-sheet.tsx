import React from "react";
import type { PressableProps } from "react-native";
import { Pressable, ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XIcon } from "phosphor-react-native";

import { Icon } from "@/components/ui/icon";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { colors, radii, rawColorValues, spacing, typography } from "@/lib/design-tokens";

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
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const inkHex =
    colorScheme === "dark" ? rawColorValues.dark.ink : rawColorValues.light.ink;
  const [open, setOpen] = React.useState(autoPresent);
  const didDismissRef = React.useRef(false);

  function handleDismiss() {
    if (didDismissRef.current) return;
    didDismissRef.current = true;
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
        didDismissRef.current = false;
        setOpen(true);
        children.props.onPress?.(event);
      },
    });
  }

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet open={open} onDismiss={handleDismiss}>
        <View style={[styles.sheet, { marginBottom: insets.bottom }]}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleDismiss}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            >
              <Icon as={XIcon} size={20} style={{ color: inkHex }} />
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            {headerRight ?? <View style={styles.headerSpacer} />}
          </View>
          <ScrollView contentContainerStyle={styles.contentContainer}>{content}</ScrollView>
          <View style={styles.footer}>{footer}</View>
        </View>
      </ModalBottomSheet>
    </>
  );
});

const styles = StyleSheet.create({
  sheet: {
    marginHorizontal: spacing[4],
    flex: 1,
    borderRadius: radii["3xl"],
    overflow: "hidden",
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  iconButton: {
    height: spacing[10],
    width: spacing[10],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
  },
  iconButtonPressed: {
    backgroundColor: colors.surfaceDim,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textXl,
    fontStyle: "italic",
    color: colors.ink,
  },
  headerSpacer: {
    height: spacing[10],
    width: spacing[10],
  },
  contentContainer: {
    gap: spacing[4],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  footer: {
    backgroundColor: colors.background,
  },
});
