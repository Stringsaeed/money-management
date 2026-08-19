import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

interface SetupCategoryMappingRowProps {
  categoryId: string;
  categoryIds: readonly string[];
  icon: string;
  name: string;
  onChange: (categoryIds: string[]) => void;
}

export const SetupCategoryMappingRow = ({
  categoryId,
  categoryIds,
  icon,
  name,
  onChange,
}: SetupCategoryMappingRowProps) => {
  const handleRemove = () => onChange(categoryIds.filter((id) => id !== categoryId));
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      layout={LinearTransition}
      className="flex-row items-center gap-2"
    >
      <Text className="flex-1 font-body-normal text-sm text-ink">
        {icon} {name}
      </Text>
      <Button
        accessibilityLabel={`Remove ${name} Mapping`}
        onPress={handleRemove}
        size="sm"
        variant="ghost"
      >
        <Text>Remove</Text>
      </Button>
    </Animated.View>
  );
};
