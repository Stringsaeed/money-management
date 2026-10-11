import { format } from "date-fns";
import { StyleSheet, View } from "react-native";

import { Avatar, fonts, space, Text } from "@/ui/trove";

import { HomeBellButton } from "./home-bell-button";

interface HomeHeaderProps {
  readonly now: Date;
  readonly title: string;
  readonly initials: string;
  readonly household: boolean;
  readonly dueThisWeek: number;
  readonly onOpenScope: () => void;
  readonly onOpenDue: () => void;
}

/** Avatar (opens the ledger switch), today's stamp over the greeting, and the due bell. */
export function HomeHeader({
  now,
  title,
  initials,
  household,
  dueThisWeek,
  onOpenScope,
  onOpenDue,
}: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      <Avatar
        accessibilityLabel="Profile and ledger"
        initials={initials}
        onPress={onOpenScope}
        scope={household ? "household" : "personal"}
      />
      <View style={styles.titleBlock}>
        <Text numberOfLines={1} tone="tertiary" variant="stamp">
          {format(now, "EEE dd.MM.yy")}
        </Text>
        <Text accessibilityRole="header" numberOfLines={1} style={styles.title} variant="titleLg">
          {title}
        </Text>
      </View>
      <HomeBellButton count={dueThisWeek} onPress={onOpenDue} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", gap: space[3] },
  titleBlock: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, letterSpacing: -0.4, lineHeight: 30 },
});
