import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { ICON_BOX, SCOPE_EMOJI_LINE_HEIGHT, SCOPE_EMOJI_SIZE } from "./constants";
import { RoundButton } from "./round-button";
import type { TabBarScope } from "./types";
import { scopeButtonLabel, scopeEmoji } from "./utils";

export interface ScopeButtonProps {
  scope: TabBarScope;
  onPress: () => void;
  expanded?: boolean;
  label?: string;
}

/** The round ledger switch: 👤 personal or 🏠 household, sized and centred like the icons. */
export function ScopeButton({ scope, onPress, expanded, label }: ScopeButtonProps) {
  return (
    <RoundButton
      expanded={expanded}
      label={label ?? scopeButtonLabel(scope)}
      onPress={onPress}
      variant="surface"
    >
      <View style={styles.box}>
        <Text allowFontScaling={false} style={styles.emoji}>
          {scopeEmoji(scope)}
        </Text>
      </View>
    </RoundButton>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", height: ICON_BOX, justifyContent: "center", width: ICON_BOX },
  // Full box width: text layout centres the glyph on the pixel grid; flex centring was 1px off.
  emoji: {
    fontSize: SCOPE_EMOJI_SIZE,
    lineHeight: SCOPE_EMOJI_LINE_HEIGHT,
    textAlign: "center",
    width: ICON_BOX,
  },
});
