import { Link } from "expo-router";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { styles } from "@/components/envelopes/styles";
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
      style={styles.prerequisiteCard}
    >
      <Text style={styles.textSemiboldInk}>
        {isAccount ? "🏦 Add Money you can budget" : "🏷️ Add an expense Category"}
      </Text>
      <Text selectable style={styles.prerequisiteText}>
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
