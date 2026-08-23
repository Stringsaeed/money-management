import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { SetupDraftCategorySuggestion } from "@/modules/budgeting/budgeting";

interface SetupCategoryMappingOptionProps {
  category: SetupDraftCategorySuggestion;
  envelopeName: string;
  onMapCategory: (categoryId: string) => void;
}

export const SetupCategoryMappingOption = ({
  category,
  envelopeName,
  onMapCategory,
}: SetupCategoryMappingOptionProps) => {
  const handlePress = () => onMapCategory(category.id);
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
      <Button
        accessibilityLabel={`Map ${category.name} to ${envelopeName}`}
        onPress={handlePress}
        size="sm"
        variant="ghost"
      >
        <Text>
          Map {category.icon} {category.name} here
        </Text>
      </Button>
    </Animated.View>
  );
};
