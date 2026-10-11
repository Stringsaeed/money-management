import { ScrollView, StyleSheet } from "react-native";

import { spacing } from "@/ui/design-tokens";
import { Screen } from "@/ui/screen";

import { GotPaidForm } from "./got-paid-form";
import { PaydayGate } from "./payday-gate";

/** C0: Got paid. Opened from the Budget home banner or the payday reminder. */
export function GotPaidScreen() {
  return (
    <PaydayGate>
      {(view) => (
        <Screen edges={["bottom"]}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            <GotPaidForm view={view} />
          </ScrollView>
        </Screen>
      )}
    </PaydayGate>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing[5], paddingBottom: spacing[10] },
});
