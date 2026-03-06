import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { BackspaceIcon } from "phosphor-react-native";

import { Text } from "@/components/ui/text";

const MAX_AMOUNT_CENTS = 9_999_999_99;
const KEY_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["00", "0", "backspace"],
] as const;

interface TransactionAmountPadProps {
  valueCents: number;
  currency: string;
  accentColor: string;
  validationMessage?: string | null;
  onChangeCents: (cents: number) => void;
}

interface KeypadKeyProps {
  label: string;
  accentColor: string;
  onPress: () => void;
  onLongPress?: () => void;
}

const triggerSelectionHaptic = () => {
  if (process.env.EXPO_OS === "ios") {
    Haptics.selectionAsync();
  }
};

const formatAmount = (cents: number) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

const appendDigits = (current: number, digits: string) => {
  let next = current;

  for (const digit of digits) {
    next = Math.min(MAX_AMOUNT_CENTS, next * 10 + Number(digit));
  }

  return next;
};

const KeypadKey = ({ label, accentColor, onPress, onLongPress }: KeypadKeyProps) => {
  const isActionKey = label === "backspace";
  const actionText = isActionKey ? "⌫" : label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isActionKey ? "Delete one digit" : `Enter ${label}`}
      className="flex-1 aspect-square rounded-[26px] items-center justify-center active:opacity-85"
      onLongPress={onLongPress}
      onPress={onPress}
      style={{
        backgroundColor: isActionKey ? "#111827" : `${accentColor}14`,
        borderColor: isActionKey ? "#111827" : `${accentColor}25`,
        borderWidth: 1,
      }}
    >
      {isActionKey ? (
        <BackspaceIcon color="#FFFFFF" size={26} weight="regular" />
      ) : (
        <Text className="text-[30px] font-bold tabular-nums" style={{ color: accentColor }}>
          {actionText}
        </Text>
      )}
    </Pressable>
  );
};

export const TransactionAmountPad = ({
  valueCents,
  currency,
  accentColor,
  validationMessage,
  onChangeCents,
}: TransactionAmountPadProps) => {
  const scale = useSharedValue(1);

  const animatedDisplayStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.03, { duration: 110 }),
      withTiming(1, { duration: 180 }),
    );
  }, [scale, valueCents]);

  const handleKeyPress = (key: (typeof KEY_ROWS)[number][number]) => {
    triggerSelectionHaptic();

    if (key === "backspace") {
      onChangeCents(Math.floor(valueCents / 10));
      return;
    }

    onChangeCents(appendDigits(valueCents, key));
  };

  const handleClear = () => {
    triggerSelectionHaptic();
    onChangeCents(0);
  };

  return (
    <View className="gap-4">
      <View className="overflow-hidden rounded-[32px] border border-white/10 bg-neutral-950 px-5 py-5">
        <View className="flex-row items-center justify-between">
          <View className="rounded-full bg-white/10 px-3 py-1.5">
            <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-white/65">
              💸 Amount
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            className="rounded-full bg-white/8 px-3 py-1.5 active:opacity-80"
            onPress={handleClear}
          >
            <Text className="text-xs font-semibold text-white/75">Reset</Text>
          </Pressable>
        </View>

        <Animated.View className="mt-5 gap-2" style={animatedDisplayStyle}>
          <View className="flex-row items-end gap-2">
            <Text className="text-[46px] font-extrabold text-white tabular-nums">
              {formatAmount(valueCents)}
            </Text>
            <Text className="pb-2 text-sm font-semibold uppercase tracking-[1.2px] text-white/50">
              {currency}
            </Text>
          </View>

          <Text className="text-sm leading-6 text-white/60">
            {validationMessage ??
              "Tap the pad to compose the amount with buttery-safe precision ✨"}
          </Text>
        </Animated.View>
      </View>

      <View className="rounded-[32px] bg-white p-3 shadow-sm">
        <View className="gap-3">
          {KEY_ROWS.map((row) => (
            <View key={row.join("-")} className="flex-row gap-3">
              {row.map((key) => (
                <KeypadKey
                  key={key}
                  accentColor={accentColor}
                  label={key}
                  onLongPress={key === "backspace" ? handleClear : undefined}
                  onPress={() => handleKeyPress(key)}
                />
              ))}
            </View>
          ))}
        </View>

        <Text className="mt-4 text-center text-xs font-medium text-gray-400">
          Hold ⌫ to clear everything.
        </Text>
      </View>
    </View>
  );
};
