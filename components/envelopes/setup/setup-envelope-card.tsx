import { TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type {
  SetupDraftCategorySuggestion,
  SetupDraftEnvelope,
} from "@/modules/budgeting/budgeting";
import { centsToDecimalString, decimalStringToCents } from "@/utils/currency";

interface SetupEnvelopeCardProps {
  categories: readonly SetupDraftCategorySuggestion[];
  envelope: SetupDraftEnvelope;
  onChange: (changes: Partial<SetupDraftEnvelope>) => void;
  onMapCategory: (categoryId: string) => void;
}

export const SetupEnvelopeCard = ({
  categories,
  envelope,
  onChange,
  onMapCategory,
}: SetupEnvelopeCardProps) => (
  <Animated.View
    entering={FadeIn}
    exiting={FadeOut}
    layout={LinearTransition}
    className="gap-3 rounded-2xl border border-ledger-outline bg-surface p-4"
  >
    <View className="flex-row items-center gap-2">
      <Text className="text-xl">{envelope.icon}</Text>
      <Text className="flex-1 font-heading-normal text-lg italic text-ink">{envelope.name}</Text>
    </View>
    <View className="gap-2">
      <Text className="font-body-semibold text-xs uppercase tracking-wide text-ink/50">
        Category Mappings
      </Text>
      {envelope.categoryIds.map((categoryId) => {
        const category = categories.find(({ id }) => id === categoryId);
        return (
          <View key={categoryId} className="flex-row items-center gap-2">
            <Text className="flex-1 font-body-normal text-sm text-ink">
              {category?.icon ?? "🏷️"} {category?.name ?? categoryId}
            </Text>
            <Button
              accessibilityLabel={`Remove ${category?.name ?? categoryId} Mapping`}
              onPress={() =>
                onChange({
                  categoryIds: envelope.categoryIds.filter((id) => id !== categoryId),
                })
              }
              size="sm"
              variant="ghost"
            >
              <Text>Remove</Text>
            </Button>
          </View>
        );
      })}
      {categories
        .filter(({ id }) => !envelope.categoryIds.includes(id))
        .map((category) => (
          <Button
            key={category.id}
            accessibilityLabel={`Map ${category.name} to ${envelope.name}`}
            onPress={() => onMapCategory(category.id)}
            size="sm"
            variant="ghost"
          >
            <Text>
              Map {category.icon} {category.name} here
            </Text>
          </Button>
        ))}
    </View>
    <Button
      accessibilityLabel={`Toggle ${envelope.name} Rollover`}
      onPress={() => onChange({ positiveRollover: !envelope.positiveRollover })}
      variant="outline"
    >
      <Text>{envelope.positiveRollover ? "Rollover: carry forward" : "Rollover: start fresh"}</Text>
    </Button>
    <View className="gap-1">
      <Text className="font-body-semibold text-xs uppercase tracking-wide text-ink/50">
        Optional initial Assignment
      </Text>
      <TextInput
        accessibilityLabel={`${envelope.name} initial Assignment`}
        className="h-11 rounded-xl bg-surface-container px-3 font-body-normal text-ink"
        defaultValue={centsToDecimalString(envelope.initialAssignmentMinor)}
        inputMode="decimal"
        onEndEditing={({ nativeEvent }) =>
          onChange({ initialAssignmentMinor: decimalStringToCents(nativeEvent.text) })
        }
      />
    </View>
  </Animated.View>
);
