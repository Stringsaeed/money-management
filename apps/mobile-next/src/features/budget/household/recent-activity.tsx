import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { spacing } from "@/ui/design-tokens";
import { Section } from "@/ui/section";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import { activitySentence } from "./activity-sentence";
import { useBudgetActivity } from "./use-budget-activity";

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** H3: who moved money lately. Renders nothing until there is something to say. */
export function RecentActivity() {
  const { items } = useBudgetActivity();
  if (items.length === 0) return null;
  return (
    <Section title="Recent activity">
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text variant="body">{activitySentence(item, money)}</Text>
          <Text variant="caption">
            {formatDistanceToNowStrict(parseISO(item.createdAt), { addSuffix: true })}
          </Text>
        </View>
      ))}
    </Section>
  );
}

const styles = StyleSheet.create({ row: { gap: spacing[0.5] } });
