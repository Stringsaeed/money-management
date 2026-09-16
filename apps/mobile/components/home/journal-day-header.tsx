import { useColorScheme, View } from "react-native";

import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { formatDayHeader } from "@/utils/date";

import { styles, journalDayBackgroundStyle, journalDayBackgroundStyleDark } from "./styles";
import type { JournalDayHeaderProps } from "./types";

export function JournalDayHeader({ item }: JournalDayHeaderProps) {
  const colorScheme = useColorScheme();
  const net = item.totalIncome - item.totalExpense;

  return (
    <View
      style={[
        styles.journalDayHeader,
        colorScheme === "dark" ? journalDayBackgroundStyleDark : journalDayBackgroundStyle,
      ]}
    >
      <Text style={styles.journalDayHeaderText}>{formatDayHeader(item.date)}</Text>
      {(item.totalIncome > 0 || item.totalExpense > 0) && (
        <MoneyText
          cents={net}
          currency={item.currency}
          sign={net >= 0 ? "+" : ""}
          style={net >= 0 ? styles.journalDayNetPositive : styles.journalDayNetNegative}
        />
      )}
    </View>
  );
}
