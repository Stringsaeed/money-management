import { CaretDownIcon } from "phosphor-react-native";
import { Pressable, Text, useColorScheme, View, type ViewStyle } from "react-native";

import { colors } from "@/lib/design-tokens";

import { styles, darkStyles } from "./styles";

interface LedgerScopeBadgeProps {
  readonly emoji: string;
  readonly label: string;
  readonly interactive?: boolean;
  readonly onPress?: () => void;
}

export function LedgerScopeBadge({ emoji, label, interactive, onPress }: LedgerScopeBadgeProps) {
  const isDark = useColorScheme() === "dark";

  const containerStyle: ViewStyle[] = [styles.trigger];
  if (interactive) {
    containerStyle.push(styles.triggerInteractive);
    if (isDark) containerStyle.push(darkStyles.triggerInteractive);
  }

  if (interactive && onPress) {
    return (
      <Pressable style={containerStyle} onPress={onPress}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <CaretDownIcon size={12} color={String(colors.foreground)} style={styles.caret} />
      </Pressable>
    );
  }

  return (
    <View style={styles.trigger}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
