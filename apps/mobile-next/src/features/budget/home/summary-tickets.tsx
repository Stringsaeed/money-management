import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { SummaryTicket } from "@/ui/trove";

import type { TicketCopy } from "./summary-tickets-model";

interface SummaryTicketsProps {
  readonly bills: TicketCopy;
  readonly saving: TicketCopy;
  /** The emoji of the big payment the saving ticket names. */
  readonly savingEmoji: string;
}

const BILLS_EMOJI = "🧾";

const openBills = (tab: "month" | "saving") =>
  router.push({ pathname: "/budget/bills", params: { tab } });

/** BILLS and SAVING FOR side by side: torn tickets into Bills & big payments. */
export function SummaryTickets({ bills, saving, savingEmoji }: SummaryTicketsProps) {
  return (
    <View style={styles.row}>
      <SummaryTicket
        accessibilityHint="Opens bills this month"
        accessibilityLabel={`Bills: ${bills.value}, ${bills.sub}`}
        emoji={BILLS_EMOJI}
        label="BILLS"
        onPress={() => openBills("month")}
        style={styles.ticket}
        sub={bills.sub}
        value={bills.value}
      />
      <SummaryTicket
        accessibilityHint="Opens what you are saving for"
        accessibilityLabel={`Saving for: ${saving.value}, ${saving.sub}`}
        emoji={savingEmoji}
        label="SAVING FOR"
        onPress={() => openBills("saving")}
        style={styles.ticket}
        sub={saving.sub}
        value={saving.value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  ticket: { flex: 1 },
});
