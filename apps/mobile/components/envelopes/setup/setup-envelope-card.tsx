import { View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { SetupAssignmentInput } from "@/components/envelopes/setup/setup-assignment-input";
import { SetupCategoryMappingOption } from "@/components/envelopes/setup/setup-category-mapping-option";
import { SetupCategoryMappingRow } from "@/components/envelopes/setup/setup-category-mapping-row";
import { SetupEnvelopeIdentityFields } from "@/components/envelopes/setup/setup-envelope-identity-fields";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type {
  SetupDraftCategorySuggestion,
  SetupDraftEnvelope,
} from "@/modules/budgeting/budgeting";

interface SetupEnvelopeCardProps {
  categories: readonly SetupDraftCategorySuggestion[];
  currency: string;
  envelope: SetupDraftEnvelope;
  mergeSelected: boolean;
  onChange: (changes: Partial<SetupDraftEnvelope>) => void;
  onMapCategory: (categoryId: string) => void;
  onRemoveCategory: (categoryId: string) => void;
  onToggleRollover: VoidFunction;
  onToggleMergeSelection: VoidFunction;
}

export const SetupEnvelopeCard = ({
  categories,
  currency,
  envelope,
  mergeSelected,
  onChange,
  onMapCategory,
  onRemoveCategory,
  onToggleRollover,
  onToggleMergeSelection,
}: SetupEnvelopeCardProps) => {
  const handleAssignment = (initialAssignmentMinor: number) => onChange({ initialAssignmentMinor });
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      layout={LinearTransition}
      className="gap-3 rounded-2xl border border-ledger-outline bg-surface p-4"
    >
      <SetupEnvelopeIdentityFields currency={currency} envelope={envelope} onChange={onChange} />
      <Button
        accessibilityLabel={`${mergeSelected ? "Unselect" : "Select"} ${envelope.name} for merge`}
        onPress={onToggleMergeSelection}
        variant={mergeSelected ? "secondary" : "outline"}
      >
        <Text>{mergeSelected ? "Selected for merge" : "Select for merge"}</Text>
      </Button>
      <View className="gap-2">
        <Text className="font-body-semibold text-xs uppercase tracking-wide text-ink/50">
          Category Mappings
        </Text>
        {envelope.categoryIds.map((categoryId) => {
          const category = categories.find(({ id }) => id === categoryId);
          return (
            <SetupCategoryMappingRow
              key={categoryId}
              categoryId={categoryId}
              icon={category?.icon ?? "🏷️"}
              name={category?.name ?? categoryId}
              onRemove={onRemoveCategory}
            />
          );
        })}
        {categories
          .filter(({ id }) => !envelope.categoryIds.includes(id))
          .map((category) => (
            <SetupCategoryMappingOption
              key={category.id}
              category={category}
              envelopeName={envelope.name}
              onMapCategory={onMapCategory}
            />
          ))}
      </View>
      <Button
        accessibilityLabel={`Toggle ${envelope.name} Rollover`}
        onPress={onToggleRollover}
        variant="outline"
      >
        <Text>
          {envelope.positiveRollover ? "Rollover: carry forward" : "Rollover: start fresh"}
        </Text>
      </Button>
      <SetupAssignmentInput
        amountMinor={envelope.initialAssignmentMinor}
        envelopeName={envelope.name}
        onChange={handleAssignment}
      />
    </Animated.View>
  );
};
