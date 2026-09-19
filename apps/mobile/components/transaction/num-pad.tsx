import { PressableScale } from "pressto";
import { StyleSheet, View } from "react-native";
import { BackspaceIcon, DotOutlineIcon } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "../ui/icon";
import { Text } from "../ui/text";
import { colors, typography } from "@/lib/design-tokens";

interface NumberPadProps {
  onPress: (value: number) => void;
  onDelete?: () => void;
  onClear?: () => void;
  onDot?: () => void;
  showDot?: boolean;
}

export default function NumberPad({
  onPress,
  onDelete,
  onClear,
  onDot,
  showDot = true,
}: NumberPadProps) {
  const insets = useSafeAreaInsets();

  const renderButton = (value: string) => {
    const handlePress = () => {
      if (value === "delete") {
        onDelete?.();
      } else if (value === "clear") {
        onClear?.();
      } else if (value === "dot") {
        onDot?.();
      } else {
        onPress(parseInt(value));
      }
    };

    return (
      <PressableScale
        key={value}
        onPress={handlePress}
        onLongPress={() => {
          if (value === "delete") {
            onClear?.();
          }
        }}
        style={styles.button}
      >
        {value === "delete" ? (
          <Icon as={BackspaceIcon} size={24} style={styles.icon} weight="regular" />
        ) : value === "dot" ? (
          <Icon as={DotOutlineIcon} size={24} style={styles.icon} weight="fill" />
        ) : (
          <Text style={styles.digit}>{value}</Text>
        )}
      </PressableScale>
    );
  };

  const numbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [showDot ? "dot" : "", "0", "delete"],
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {numbers.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((value) =>
            value ? renderButton(value) : <View key="empty" style={styles.emptyButton} />,
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  digit: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: 28,
    color: colors.ink,
  },
  icon: {
    color: colors.ink,
  },
});
