import { CaretRightIcon } from "phosphor-react-native";
import { View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

import type { SettingsRowProps } from "./types";
import { PressableOpacity } from "pressto";

export function SettingsRow({
  emoji,
  label,
  subtitle,
  onPress,
  rightLabel,
  noChevron,
  testID,
}: SettingsRowProps) {
  return (
    <PressableOpacity
      accessibilityLabel={onPress ? label : undefined}
      accessibilityRole={onPress ? "button" : undefined}
      enabled={onPress !== undefined}
      onPress={onPress}
      testID={testID}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
      }}
    >
      <Text className="text-xl w-7 text-center">{emoji}</Text>
      <View className="flex-1">
        <Text className="font-body-medium text-base text-ink">{label}</Text>
        {subtitle ? (
          <Text className="font-body-normal text-xs text-ink/40 mt-0.5">{subtitle}</Text>
        ) : null}
      </View>
      {rightLabel ? (
        <Text
          className="font-body-semibold text-sm text-ink/40"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {rightLabel}
        </Text>
      ) : null}
      {!noChevron && <Icon as={CaretRightIcon} className="text-ink/20" size={16} />}
    </PressableOpacity>
  );
}
