import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, View } from "react-native";
import { colors, spacing } from "./design-tokens";
import { Text } from "./text";

export const KeyboardAccessory = ({ nativeID }: { readonly nativeID: string }) => {
  if (Platform.OS !== "ios") return null;
  return (
    <InputAccessoryView nativeID={nativeID} backgroundColor={colors.surfaceContainer}>
      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done editing"
          onPress={Keyboard.dismiss}
          style={styles.done}
        >
          <Text variant="label" style={styles.label}>
            Done
          </Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    alignItems: "flex-end",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ledgerOutline,
    paddingHorizontal: spacing[4],
  },
  done: {
    minHeight: spacing[11],
    minWidth: spacing[12],
    alignItems: "center",
    justifyContent: "center",
  },
  label: { color: colors.ink },
});
