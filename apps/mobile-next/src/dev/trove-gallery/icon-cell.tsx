import { StyleSheet, View } from "react-native";

import { colors, Icon, space, Text, type IconName } from "@/ui/trove";

interface IconCellProps {
  name: IconName;
  filled?: boolean;
}

export function IconCell({ name, filled = false }: IconCellProps) {
  return (
    <View style={styles.cell}>
      <Icon color={colors.text.primary} filled={filled} name={name} />
      <Text numberOfLines={1} tone="tertiary" variant="stamp">
        {filled ? `${name}*` : name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: "center",
    gap: space[1],
    paddingVertical: space[2],
    width: "25%",
  },
});
