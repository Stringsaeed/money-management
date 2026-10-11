import { StyleSheet, View } from "react-native";

import { Button } from "@/ui/button";
import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { TextField } from "@/ui/text-field";

import { PanelError } from "../envelope/panel-error";

import { HOUSEHOLD_SHARE_NAME } from "./share-model";
import { useHouseholdShare } from "./use-household-share";

/** H2, after the household budget exists: offer your share as a Bill in your Personal budget. */
export function HouseholdSharePrompt() {
  const share = useHouseholdShare();
  if (!share.offered) return null;
  return (
    <View style={styles.card}>
      <Text variant="title">{`Add ${HOUSEHOLD_SHARE_NAME} to your Personal budget?`}</Text>
      <Text variant="caption">
        A Bill in your own budget for what you put into this household each month. Your Personal
        budget stays separate.
      </Text>
      <TextField
        label="Your monthly share"
        placeholder="0"
        keyboardType="decimal-pad"
        value={share.amountText}
        onChangeText={share.setAmountText}
      />
      {share.problem ? (
        <Text accessibilityRole="alert" variant="caption" style={styles.problem}>
          {share.problem}
        </Text>
      ) : null}
      <PanelError message={share.error} />
      <Button
        title="Add to Personal budget"
        loading={share.busy}
        disabled={!share.ready}
        onPress={() => void share.add()}
      />
      <Button title="Not now" variant="ghost" onPress={share.notNow} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    gap: spacing[2],
    padding: spacing[4],
  },
  problem: { color: colors.textWarning },
});
