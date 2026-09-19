import { Pressable, View } from "react-native";

import { styles } from "@/components/envelopes/styles";
import { Text } from "@/components/ui/text";

import type { UseEnvelopeFormReturn } from "./form";

interface EnvelopeSettingsFieldsProps {
  form: UseEnvelopeFormReturn;
  maximumSortOrder: number;
}

export function EnvelopeSettingsFields({ form, maximumSortOrder }: EnvelopeSettingsFieldsProps) {
  return (
    <>
      <form.Field name="positiveRollover">
        {(field) => (
          <View style={styles.gap2}>
            <Text style={styles.textMediumSmInk60}>Positive Rollover</Text>
            <Pressable
              accessibilityLabel="Carry positive Available Money forward"
              accessibilityRole="switch"
              accessibilityState={{ checked: field.state.value }}
              onPress={() => field.handleChange(!field.state.value)}
              style={styles.settingOptionBase}
            >
              <Text style={styles.textMediumInkSm}>
                {field.state.value ? "Carries forward ✓" : "Starts fresh each month"}
              </Text>
            </Pressable>
          </View>
        )}
      </form.Field>

      <form.Field name="sortOrder">
        {(field) => (
          <View style={styles.gap2}>
            <Text style={styles.textMediumSmInk60}>Manual order</Text>
            <View style={styles.flexRowItemsCenter}>
              <Pressable
                accessibilityLabel="Move Envelope earlier"
                accessibilityRole="button"
                accessibilityState={{ disabled: field.state.value === 0 }}
                disabled={field.state.value === 0}
                onPress={() => field.handleChange(field.state.value - 1)}
                style={({ pressed }) => [
                  styles.sortOrderButton,
                  pressed && styles.sortOrderButtonPressed,
                  field.state.value === 0 && styles.sortOrderButtonDisabled,
                ]}
              >
                <Text style={styles.textMediumInkSm}>Earlier</Text>
              </Pressable>
              <Text
                accessibilityLabel={`Envelope position ${field.state.value + 1}`}
                style={styles.sortOrderText}
              >
                {field.state.value + 1}
              </Text>
              <Pressable
                accessibilityLabel="Move Envelope later"
                accessibilityRole="button"
                accessibilityState={{ disabled: field.state.value >= maximumSortOrder }}
                disabled={field.state.value >= maximumSortOrder}
                onPress={() => field.handleChange(field.state.value + 1)}
                style={({ pressed }) => [
                  styles.sortOrderButton,
                  pressed && styles.sortOrderButtonPressed,
                  field.state.value >= maximumSortOrder && styles.sortOrderButtonDisabled,
                ]}
              >
                <Text style={styles.textMediumInkSm}>Later</Text>
              </Pressable>
            </View>
          </View>
        )}
      </form.Field>
    </>
  );
}
