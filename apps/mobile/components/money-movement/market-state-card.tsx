import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";

interface MarketStateCardProps {
  title: string;
  message: string;
}

export function MarketStateCard({ title, message }: MarketStateCardProps) {
  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing[5],
    backgroundColor: colors.surfaceContainer,
    padding: spacing[5],
    borderCurve: "continuous",
  },
  title: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.text2xl,
    fontStyle: "italic",
    color: colors.ink,
  },
  message: {
    marginTop: spacing[3],
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    lineHeight: 24,
    color: colors.ink,
    opacity: 0.6,
  },
});
