import { format } from "date-fns";
import { StyleSheet, View } from "react-native";

import { Avatar, Header, layout, space } from "@/ui/trove";

interface HomeHeaderProps {
  readonly name: string;
  readonly initials: string;
  readonly household: boolean;
  readonly onOpenFilters: () => void;
  readonly onOpenProfile: () => void;
}

/** Pinned above the scroll: the profile avatar, a greeting under today's stamp, and the filter. */
export function HomeHeader({
  name,
  initials,
  household,
  onOpenFilters,
  onOpenProfile,
}: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      <Header
        title={`Hello, ${name}`}
        stamp={format(new Date(), "EEE dd.MM.yy").toUpperCase()}
        leading={
          <Avatar
            accessibilityLabel="Open profile"
            initials={initials}
            onPress={onOpenProfile}
            scope={household ? "household" : "personal"}
          />
        }
        actions={[{ icon: "filter", label: "Filter overview", onPress: onOpenFilters }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: space[2], paddingHorizontal: layout.screenGutter, paddingTop: space[2] },
});
