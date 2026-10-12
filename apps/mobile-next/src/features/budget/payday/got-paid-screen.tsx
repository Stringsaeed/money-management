import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { colors, layout, radius, Screen, space } from "@/ui/trove";

import { GotPaidForm } from "./got-paid-form";
import { PaydayGate } from "./payday-gate";

/**
 * C0: Got paid, a modal opened from the Budget home payday slot or the payday reminder. The board
 * draws it as a sheet over Budget home, so it keeps the sheet's grabber and paddings.
 */
export function GotPaidScreen() {
  return (
    <PaydayGate onClose={() => router.back()} tag="PAYDAY">
      {(view) => (
        <Screen>
          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.content}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.grabber}
            />
            <GotPaidForm view={view} />
          </ScrollView>
        </Screen>
      )}
    </PaydayGate>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingBottom: space[3],
    paddingHorizontal: layout.screenGutter,
    paddingTop: space[3],
  },
  grabber: {
    alignSelf: "center",
    backgroundColor: colors.border.default,
    borderRadius: radius.full,
    height: 5,
    width: 36,
  },
});
