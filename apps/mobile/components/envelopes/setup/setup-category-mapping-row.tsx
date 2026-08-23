import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

interface SetupCategoryMappingRowProps {
  categoryId: string;
  icon: string;
  name: string;
  onRemove: (categoryId: string) => void;
}

export const SetupCategoryMappingRow = ({
  categoryId,
  icon,
  name,
  onRemove,
}: SetupCategoryMappingRowProps) => {
  const handleRemove = () => onRemove(categoryId);
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
