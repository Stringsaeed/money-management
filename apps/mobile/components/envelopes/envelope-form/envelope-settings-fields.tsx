import { Pressable, View } from "react-native";

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
          <View className="gap-2">
            <Text className="font-body-medium text-sm text-ink/60">Positive Rollover</Text>
            <Pressable
              accessibilityLabel="Carry positive Available Money forward"
              accessibilityRole="switch"
              accessibilityState={{ checked: field.state.value }}
              className="rounded-2xl border border-ledger-outline bg-surface px-4 py-3"
              onPress={() => field.handleChange(!field.state.value)}
            >
              <Text className="font-body-medium text-sm text-ink">
                {field.state.value ? "Carries forward ✓" : "Starts fresh each month"}
              </Text>
            </Pressable>
          </View>
        )}
      </form.Field>

      <form.Field name="sortOrder">
        {(field) => (
          <View className="gap-2">
            <Text className="font-body-medium text-sm text-ink/60">Manual order</Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                accessibilityLabel="Move Envelope earlier"
                accessibilityRole="button"
                accessibilityState={{ disabled: field.state.value === 0 }}
                className="min-h-12 flex-1 items-center justify-center rounded-xl border border-ledger-outline bg-surface px-3 active:bg-surface-dim disabled:opacity-40"
                disabled={field.state.value === 0}
                onPress={() => field.handleChange(field.state.value - 1)}
              >
                <Text className="font-body-medium text-sm text-ink">Earlier</Text>
              </Pressable>
              <Text
                accessibilityLabel={`Envelope position ${field.state.value + 1}`}
                className="font-body-semibold text-sm text-ink"
              >
                {field.state.value + 1}
              </Text>
              <Pressable
                accessibilityLabel="Move Envelope later"
                accessibilityRole="button"
                accessibilityState={{ disabled: field.state.value >= maximumSortOrder }}
                className="min-h-12 flex-1 items-center justify-center rounded-xl border border-ledger-outline bg-surface px-3 active:bg-surface-dim disabled:opacity-40"
                disabled={field.state.value >= maximumSortOrder}
                onPress={() => field.handleChange(field.state.value + 1)}
              >
                <Text className="font-body-medium text-sm text-ink">Later</Text>
              </Pressable>
            </View>
          </View>
        )}
      </form.Field>
    </>
  );
}
