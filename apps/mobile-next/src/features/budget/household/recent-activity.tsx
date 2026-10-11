import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { ListGroup, ListRow, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import { activitySentence } from "./activity-sentence";
import { useBudgetActivity } from "./use-budget-activity";

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** H3: who moved money lately. Renders nothing until there is something to say. */
export function RecentActivity() {
  const { items } = useBudgetActivity();
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text variant="titleMd">Recent activity</Text>
      <ListGroup dividerInset={0}>
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={activitySentence(item, money)}
            subtitle={formatDistanceToNowStrict(parseISO(item.createdAt), { addSuffix: true })}
          />
        ))}
      </ListGroup>
    </View>
  );
}

const styles = StyleSheet.create({ section: { gap: space[3] } });
