import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { QuoteRow } from "@/components/money-movement/quote-row";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { layoutTransition } from "@/components/transaction/constants";
import type { MarketAssetGroup, MarketQuote } from "@/hooks/use-market-quotes";
import { colors, spacing, typography } from "@/lib/design-tokens";

interface QuoteSectionProps {
  title: MarketAssetGroup;
  quotes: MarketQuote[];
}

export function QuoteSection({ title, quotes }: QuoteSectionProps) {
  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut} layout={layoutTransition}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Badge variant="outline" style={styles.badge}>
          <Text>{quotes.length} tracked</Text>
        </Badge>
      </View>
      <View style={styles.content}>
        {quotes.map((quote, index) => (
          <QuoteRow key={quote.symbol} quote={quote} isLast={index === quotes.length - 1} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: spacing[5],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.ledgerOutline,
    paddingBottom: spacing[3],
  },
  title: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textXl,
    fontStyle: "italic",
    color: colors.ink,
  },
  badge: {
    backgroundColor: colors.surface,
  },
  content: {
    marginHorizontal: spacing[5],
    overflow: "hidden",
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
  },
});
