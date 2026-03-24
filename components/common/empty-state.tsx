import { Text } from "@/components/ui/text";
import Animated, { FadeIn } from "react-native-reanimated";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="flex-1 items-center justify-center p-8 gap-3"
    >
      {icon ? <Text className="text-5xl">{icon}</Text> : null}
      <Text className="text-lg font-semibold text-center text-foreground">{title}</Text>
      <Text className="text-sm text-center text-muted-foreground leading-5">{message}</Text>
      {action}
    </Animated.View>
  );
}
