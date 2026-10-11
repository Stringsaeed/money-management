import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { StyleSheet, View } from "react-native";

import { ListGroup, ListRow, space, Text } from "@/ui/trove";

import { useBudgetMoney } from "../currency/use-budget-currency";
import { activitySentence } from "./activity-sentence";
import { useBudgetActivity } from "./use-budget-activity";

/** H3: who moved money lately. Renders nothing until there is something to say. */
export function RecentActivity() {
  const { items } = useBudgetActivity();
  const money = useBudgetMoney();
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
