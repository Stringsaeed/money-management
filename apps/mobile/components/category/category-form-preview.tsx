import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { CATEGORY_TYPE_META } from "@/components/category/category-form-options";
import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

import type { CategoryFormValues } from "./form";

interface CategoryFormPreviewProps {
  values: CategoryFormValues;
}

export function CategoryFormPreview({ values }: CategoryFormPreviewProps) {
  const meta = CATEGORY_TYPE_META[values.type];
  const displayName = values.name.trim() || "New category";

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      layout={layoutTransition}
      style={styles.container}
    >
      <View style={styles.row}>
        <Animated.View
          layout={layoutTransition}
          style={[styles.iconCircle, { backgroundColor: `${values.color}20` }]}
        >
          <Text style={styles.icon}>{values.icon}</Text>
        </Animated.View>
        <View style={styles.labelContainer}>
          <Animated.View
            key={displayName}
            entering={FadeIn.duration(150)}
            layout={layoutTransition}
          >
            <Text style={styles.nameText} numberOfLines={1}>
              {displayName}
            </Text>
          </Animated.View>
          <Text style={styles.subtitleText}>{meta.label}</Text>
        </View>
        <View style={[styles.colorDot, { backgroundColor: values.color }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii["3xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  iconCircle: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
  },
  icon: {
    fontSize: typography.textBase,
  },
  labelContainer: {
    minWidth: 0,
    flex: 1,
  },
  nameText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  subtitleText: {
    marginTop: spacing[0.5],
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: radii.full,
  },
});
