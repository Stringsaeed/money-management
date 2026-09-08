import { TextInput, View } from "react-native";

import {
  inputTextStyle,
  resourceInputClassName,
  ResourceFormField,
} from "@/components/resource/resource-form-field";
import { Text } from "@/components/ui/text";

import type { UseEnvelopeFormReturn } from "./form";

interface EnvelopeIdentityFieldsProps {
  currency: string;
  form: UseEnvelopeFormReturn;
}

export function EnvelopeIdentityFields({ currency, form }: EnvelopeIdentityFieldsProps) {
  return (
    <>
      <form.Field
        name="name"
        validators={{
          onSubmit: ({ value }) => (!value.trim() ? "Envelope name is required" : undefined),
        }}
      >
        {(field) => (
          <ResourceFormField label="Name" error={field.state.meta.errors[0]}>
            <TextInput
              accessibilityLabel={`${currency} Envelope name`}
              className={resourceInputClassName}
              onChangeText={field.handleChange}
              placeholder="e.g. Groceries"
              placeholderTextColor="#9a9896"
              style={inputTextStyle}
              value={field.state.value}
            />
          </ResourceFormField>
        )}
      </form.Field>

      <View className="gap-2">
        <Text className="font-body-medium text-sm text-ink/60">Currency</Text>
        <View className="rounded-2xl border border-ledger-outline bg-surface px-4 py-3">
          <Text className="font-body-semibold text-base text-ink">{currency}</Text>
          <Text className="font-body-normal text-xs text-ink/50">
            Currency can&apos;t be changed after creation.
          </Text>
        </View>
      </View>
    </>
  );
}
