import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { useBudgetCurrency } from "../currency/use-budget-currency";
import { SectionHeader } from "../home/section-header";
import { activityAgo } from "./activity-ago";
import { ActivityRow } from "./activity-row";
import { activityInitial, activitySentence } from "./activity-sentence";
import { compactMoney } from "../home/compact-money";
import { useBudgetActivity } from "./use-budget-activity";

interface RecentActivityProps {
  /** Where the section sits, so the attention slot's Activity pill can scroll to it. */
  readonly onLayout?: (event: LayoutChangeEvent) => void;
}

/** H3: who moved money lately. Renders nothing until there is something to say. */
export function RecentActivity({ onLayout }: RecentActivityProps) {
  const { items } = useBudgetActivity();
  const currency = useBudgetCurrency();
  if (items.length === 0) return null;
  const now = new Date();
  const money = (minor: number) => compactMoney(minor, currency);
  return (
    <View onLayout={onLayout} style={styles.section}>
      <SectionHeader title="RECENT ACTIVITY" />
      {items.map((item) => (
        <ActivityRow
          key={item.id}
          ago={activityAgo(item.createdAt, now)}
          initial={activityInitial(item)}
          sentence={activitySentence(item, money)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ section: { gap: 2 } });
