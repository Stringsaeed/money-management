import { Link } from "expo-router";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

interface SetupPrerequisiteCardProps {
  kind: "account" | "category";
}

export const SetupPrerequisiteCard = ({ kind }: SetupPrerequisiteCardProps) => {
  const isAccount = kind === "account";
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      layout={LinearTransition}
      className="gap-3 rounded-2xl border border-ledger-outline bg-surface-container p-4"
    >
      <Text className="font-body-semibold text-ink">
        {isAccount ? "🏦 Add Money you can budget" : "🏷️ Add an expense Category"}
      </Text>
      <Text selectable className="font-body-normal text-sm leading-5 text-ink/60">
        {isAccount
          ? "Setup needs an active checking, savings, or Cash Account so every Assignment stays cash-backed."
          : "Category suggestions preserve how you already classify spending. You can also start with a blank plan."}
      </Text>
      <Link href={isAccount ? "/accounts" : "/category/new"} asChild>
        <Button
          accessibilityLabel={isAccount ? "Add an Account" : "Add a Category"}
          variant="outline"
        >
          <Text>{isAccount ? "Add an Account" : "Add a Category"}</Text>
        </Button>
      </Link>
    </Animated.View>
  );
};
