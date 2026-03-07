import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { BackspaceIcon, CheckIcon } from "phosphor-react-native";

import { Text } from "@/components/ui/text";

const MAX_AMOUNT_CENTS = 9_999_999_99;
const KEY_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["00", "0", "submit"],
] as const;

interface TransactionAmountPadProps {
  valueCents: number;
  accentColor: string;
  isSubmitting?: boolean;
  onChangeCents: (cents: number) => void;
  onBackspace?: () => void;
  onSubmit: () => void;
}

interface KeypadKeyProps {
  label: string;
  accentColor: string;
  disabled?: boolean;
  onPress: () => void;
}

const triggerSelectionHaptic = () => {
  if (process.env.EXPO_OS === "ios") {
    Haptics.selectionAsync();
  }
};

const appendDigits = (current: number, digits: string) => {
  let next = current;

  for (const digit of digits) {
    next = Math.min(MAX_AMOUNT_CENTS, next * 10 + Number(digit));
  }

  return next;
};

const KeypadKey = ({ label, accentColor, disabled, onPress }: KeypadKeyProps) => {
  const isSubmitKey = label === "submit";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isSubmitKey ? "Save transaction" : `Enter ${label}`}
      className="flex-1 aspect-square rounded-[26px] items-center justify-center active:opacity-85"
      disabled={disabled}
      onPress={onPress}
      style={{
        backgroundColor: isSubmitKey ? accentColor : "#F3F4F6",
        borderColor: isSubmitKey ? accentColor : "#E5E7EB",
        borderWidth: 1,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {isSubmitKey ? (
        <CheckIcon color="#FFFFFF" size={28} weight="bold" />
      ) : (
        <Text className="text-[30px] font-bold tabular-nums text-gray-950">{label}</Text>
      )}
    </Pressable>
  );
};

export const TransactionAmountPad = ({
  valueCents,
  accentColor,
  isSubmitting = false,
  onChangeCents,
  onBackspace,
  onSubmit,
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

    if (key === "submit") {
      onSubmit();
      return;
    }

    onChangeCents(appendDigits(valueCents, key));
  };

  const handleBackspace = () => {
    triggerSelectionHaptic();
    if (onBackspace) {
      onBackspace();
      return;
    }

    onChangeCents(Math.floor(valueCents / 10));
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-end">
        <Pressable
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-200 active:opacity-80"
          onLongPress={() => onChangeCents(0)}
          onPress={handleBackspace}
        >
          <BackspaceIcon color="#111827" size={20} weight="regular" />
        </Pressable>
      </View>

      <View className="rounded-[32px] bg-white p-3 shadow-sm">
        <Animated.View className="gap-3" style={animatedDisplayStyle}>
          {KEY_ROWS.map((row) => (
            <View key={row.join("-")} className="flex-row gap-3">
              {row.map((key) => (
                <KeypadKey
                  key={key}
                  accentColor={accentColor}
                  disabled={isSubmitting}
                  label={key}
                  onPress={() => handleKeyPress(key)}
                />
              ))}
            </View>
          ))}
        </Animated.View>

        <Text className="mt-4 text-center text-xs font-medium text-gray-400">
          Tap ✓ to save. Hold ⌫ to clear.
        </Text>
      </View>
    </View>
  );
};
