import { Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import type { EnvelopeSummary } from "@/modules/budgeting/budgeting";
import { formatCents } from "@/utils/currency";

import { styles } from "./styles";

interface EnvelopeRowProps {
  envelope: EnvelopeSummary;
  onEdit?: (envelope: EnvelopeSummary) => void;
}

export function EnvelopeRow({ envelope, onEdit }: EnvelopeRowProps) {
  const content = (
    <>
      <View style={styles.flexRowGap3}>
        <Text style={styles.envelopeRowIcon}>{envelope.icon}</Text>
        <View style={styles.minW0Flex1Gap1}>
          <View style={styles.flexRowItemsCenterJustifyBetween}>
            <Text style={styles.envelopeRowTitle} numberOfLines={1}>
              {envelope.name}
            </Text>
            <Text style={styles.envelopeRowAmount}>
              {formatCents(envelope.availableMoney.amountMinor, envelope.currency)}
            </Text>
          </View>
          <Text style={styles.envelopeRowLabelXs}>Available Money</Text>
          <View style={styles.flexRowGap4}>
            <Text style={styles.textNormalXsInk60}>
              Assigned Money {formatCents(envelope.assignedMoney.amountMinor, envelope.currency)}
            </Text>
            <Text style={styles.textNormalXsInk60}>
              Net Spent {formatCents(envelope.netSpent.amountMinor, envelope.currency)}
            </Text>
          </View>
          {envelope.health.status === "needs_attention" ? (
            <Text style={styles.textDestructiveXs}>
              Needs Attention · Map an active expense Category
            </Text>
          ) : null}
        </View>
      </View>
    </>
  );
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
      {onEdit ? (
        <Pressable
          accessibilityLabel={`Edit ${envelope.name} Envelope`}
          accessibilityRole="button"
          onPress={() => onEdit(envelope)}
          style={({ pressed }) => [
            styles.envelopeRowCard,
            pressed && styles.envelopeRowCardPressed,
          ]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.envelopeRowCard}>{content}</View>
      )}
    </Animated.View>
  );
}
