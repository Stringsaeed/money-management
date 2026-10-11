import { format } from "date-fns";
import { StyleSheet, View } from "react-native";

import { space, Text } from "@/ui/trove";

import { HomeBellButton } from "./home-bell-button";

interface HomeEmptyHeaderProps {
  readonly now: Date;
  readonly onOpenDue: () => void;
}

/** First-run header from the empty board: date and time over a plain "Home", and the bell. */
export function HomeEmptyHeader({ now, onOpenDue }: HomeEmptyHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text tone="tertiary" variant="stamp">
          {format(now, "EEE dd.MM.yy · HH:mm")}
        </Text>
        <Text accessibilityRole="header" variant="display">
          Home
        </Text>
      </View>
      <HomeBellButton count={0} onPress={onOpenDue} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", gap: space[3] },
  titleBlock: { flex: 1, gap: space[1] },
});
