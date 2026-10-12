import { useRef } from "react";
import { Pressable, StyleSheet, Text as NativeText, View, type TextInput } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, radius } from "@/ui/trove";

import { InlineAmountInput } from "./inline-amount-input";
import type { ShareTileModel } from "./setup-household";

interface ShareTileProps {
  readonly tile: ShareTileModel;
  readonly currency: string;
  readonly value: string;
  readonly onChange: (userId: string, text: string) => void;
}

/** One member's expected monthly share: initial disc, name, and the amount typed in place. */
export function ShareTile({ tile, currency, value, onChange }: ShareTileProps) {
  const input = useRef<TextInput>(null);
  return (
    <Pressable accessible={false} onPress={() => input.current?.focus()} style={styles.tile}>
      <View style={[styles.disc, tile.isYou ? styles.discYou : styles.discOther]}>
        <NativeText
          importantForAccessibility="no"
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={[styles.initial, tile.isYou ? styles.initialYou : null]}
        >
          {tile.initial}
        </NativeText>
      </View>
      <View style={styles.texts}>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          style={styles.name}
        >
          {tile.name}
        </NativeText>
        <View style={styles.amount}>
          <InlineAmountInput
            accessibilityLabel={`${tile.name} monthly share, ${currency}`}
            currency={currency}
            inputRef={input}
            onChangeText={(text) => onChange(tile.userId, text)}
            size="share"
            value={value}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    backgroundColor: colors.surface.default,
    borderColor: colors.border.subtle,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    padding: 11,
  },
  disc: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  discYou: { backgroundColor: colors.accent.fill },
  discOther: { backgroundColor: colors.fill.neutral },
  initial: {
    color: colors.text.primary,
    fontFamily: fonts.extrabold,
    fontSize: 15,
    lineHeight: 20,
  },
  initialYou: { color: colors.accent.on },
  texts: { flex: 1, minWidth: 0 },
  name: { color: colors.text.secondary, fontFamily: fonts.bold, fontSize: 14, lineHeight: 19 },
  amount: { alignSelf: "flex-start" },
});
