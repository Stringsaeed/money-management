import React from "react";
import { PressableScale } from "pressto";
import { View } from "react-native";
import { ArrowLeftIcon, DotIcon } from "phosphor-react-native";
import { Text } from "../ui/text";

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
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {value === "delete" ? (
          <Text className="text-[20px]">
            <ArrowLeftIcon size={20} weight="bold" />
          </Text>
        ) : value === "dot" ? (
          <Text className="text-[20px]">
            <DotIcon size={20} weight="bold" />
          </Text>
        ) : (
          <Text className="text-[26px]">{value}</Text>
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
    <View className="flex-1 w-full justify-end min-h-50 max-h-75">
      {numbers.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} className="flex-row justify-around flex-1">
          {row.map((value) =>
            value ? (
              renderButton(value)
            ) : (
              <View key="empty" className="flex-1 justify-center items-center" />
            ),
          )}
        </View>
      ))}
    </View>
  );
}
