import { StyleSheet, View } from "react-native";

import { colors, Icon, radius } from "@/ui/trove";

/** 24pt round tick of the setup account rows: accent fill when ticked, a strong ring when not. */
export function RoundCheck({ checked }: { readonly checked: boolean }) {
  return (
    <View style={[styles.disc, checked ? styles.on : styles.off]}>
      {checked ? <Icon color={colors.accent.on} name="check" size={14} strokeWidth={3} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  on: { backgroundColor: colors.accent.fill },
  off: { borderColor: colors.border.strong, borderWidth: 1.5 },
});
