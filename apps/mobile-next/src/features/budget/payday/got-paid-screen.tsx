import { ScrollView, StyleSheet } from "react-native";

import { layout, Screen, space } from "@/ui/trove";

import { SetupHeader } from "../setup/setup-header";

import { GotPaidForm } from "./got-paid-form";
import { PaydayGate } from "./payday-gate";

/** C0: Got paid. Opened from the Budget home banner or the payday reminder. */
export function GotPaidScreen() {
  return (
    <PaydayGate title="Got paid">
      {(view) => (
        <Screen>
          <SetupHeader title="Got paid" />
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
  content: { padding: layout.screenGutter, paddingBottom: space[10] },
});
