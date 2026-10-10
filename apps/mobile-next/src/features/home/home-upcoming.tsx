import { format } from "date-fns";
import { StyleSheet, View } from "react-native";
import type { UpcomingOccurrence } from "@/data/ledger-schemas";
import {
  Banner,
  Button,
  Card,
  dueInLabel,
  layout,
  ListGroup,
  nextUpcomingIndex,
  Skeleton,
  space,
  Text,
  UpcomingRow,
} from "@/ui/trove";
import { signedMinor } from "./home-display";

interface HomeUpcomingProps {
  readonly items: readonly (UpcomingOccurrence & { readonly name: string })[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly onOpen: (id: string) => void;
  readonly onViewAll: () => void;
}

const CHIP_WIDTH = 46;
// 16pt row padding, the date chip, then the 12pt gap before the title.
const DIVIDER_INSET = layout.cardPadding + CHIP_WIDTH + space[3];

export function HomeUpcoming({ items, loading, failed, onOpen, onViewAll }: HomeUpcomingProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const nextIndex = nextUpcomingIndex(
    items.map((item) => item.scheduledDate),
    today,
  );
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <Text variant="titleSm">Upcoming transactions</Text>
          <Text tone="secondary" variant="bodySm">
            Due now and in the next month
          </Text>
        </View>
        <Button
          accessibilityLabel="View recurring transactions"
          label="View all"
          onPress={onViewAll}
          size="sm"
          variant="tertiary"
        />
      </View>
      {loading ? (
        <Card
          accessibilityLabel="Loading upcoming transactions"
          accessibilityState={{ busy: true }}
        >
          <View style={styles.skeletons}>
            <Skeleton height={20} width="60%" />
            <Skeleton height={20} />
            <Skeleton height={20} width="80%" />
          </View>
        </Card>
      ) : failed ? (
        <Banner
          tone="warning"
          message="Upcoming transactions are unavailable. Pull down to try again."
        />
      ) : items.length === 0 ? (
        <Card>
          <Text tone="secondary">Nothing scheduled. A little breathing room.</Text>
        </Card>
      ) : (
        <ListGroup dividerInset={DIVIDER_INSET}>
          {items.map((item, index) => (
            <UpcomingRow
              key={`${item.ruleId}:${item.scheduledDate}`}
              date={item.scheduledDate}
              title={item.name}
              subtitle={`${dueInLabel(item.scheduledDate, today)} · RECURRING`}
              minor={signedMinor(item.kind, item.amountMinor)}
              currency={item.currency}
              next={index === nextIndex}
              signDisplay={item.kind === "transfer" ? "never" : "always"}
              onPress={() => onOpen(item.ruleId)}
            />
          ))}
        </ListGroup>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[2] },
  heading: { alignItems: "center", flexDirection: "row", gap: space[2] },
  copy: { flex: 1 },
  skeletons: { gap: space[3] },
});
