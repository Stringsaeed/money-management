import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import Animated, { FadeIn } from "react-native-reanimated";

interface EmptyStateProps {
  icon?: string;
  illustration?: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
  /**
   * Set when the parent doesn't establish a definite height (e.g. an
   * auto-sized card in a ScrollView). `flex-1` needs a bounded ancestor to
   * grow into — without one it resolves to a zero-height flex basis and
   * clips this content, so compact mode hugs its content instead.
   */
  compact?: boolean;
}

export function EmptyState({
  icon,
  illustration,
  title,
  message,
  action,
  compact,
}: EmptyStateProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className={cn("items-center justify-center gap-3 p-8", !compact && "flex-1")}
    >
      {illustration ?? (icon ? <Text className="text-5xl">{icon}</Text> : null)}
      <Text className="text-lg font-semibold text-center text-foreground">{title}</Text>
      <Text className="text-sm text-center text-muted-foreground leading-5">{message}</Text>
      {action}
    </Animated.View>
  );
}
