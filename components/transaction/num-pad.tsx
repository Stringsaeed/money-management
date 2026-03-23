import React from "react";
import { PressableScale } from "pressto";
import { View } from "react-native";
import { BackspaceIcon, DotOutlineIcon } from "phosphor-react-native";
import { styled } from "nativewind";

import { Text } from "../ui/text";

interface NumberPadProps {
  onPress: (value: number) => void;
  onDelete?: () => void;
  onClear?: () => void;
  onDot?: () => void;
  showDot?: boolean;
}

const INK = "#1C1B1A";

const StyledPressableScale = styled(PressableScale, {
  className: {
    target: "style",
  },
});

export default function NumberPad({
  onPress,
  onDelete,
  onClear,
  onDot,
  showDot = true,
}: NumberPadProps) {
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
      <StyledPressableScale
        key={value}
        onPress={handlePress}
        onLongPress={() => {
          if (value === "delete") {
            onClear?.();
          }
        }}
        className="flex-1 justify-center items-center"
      >
        {value === "delete" ? (
          <BackspaceIcon size={24} color={INK} weight="regular" />
        ) : value === "dot" ? (
          <DotOutlineIcon size={24} color={INK} weight="fill" />
        ) : (
          <Text className="font-heading-medium text-[28px] text-ink">{value}</Text>
        )}
      </StyledPressableScale>
    );
  };

  const numbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [showDot ? "dot" : "", "0", "delete"],
  ];

  return (
    <View className="w-full flex-1 justify-end pb-safe">
      {numbers.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} className="flex-1 flex-row justify-around">
          {row.map((value) =>
            value ? (
              renderButton(value)
            ) : (
              <View key="empty" className="flex-1 items-center justify-center" />
            ),
          )}
        </View>
      ))}
    </View>
  );
}
