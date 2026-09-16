import { TextInput, View } from "react-native";

import { styles } from "@/components/envelopes/styles";
import { inputTextStyle, ResourceFormField } from "@/components/resource/resource-form-field";
import { Text } from "@/components/ui/text";
import { colors } from "@/lib/design-tokens";

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
              onChangeText={field.handleChange}
              placeholder="e.g. Groceries"
              placeholderTextColor={colors.textPlaceholder}
              style={[styles.resourceInput, inputTextStyle]}
              value={field.state.value}
            />
          </ResourceFormField>
        )}
      </form.Field>

      <View style={styles.gap2}>
        <Text style={styles.textMediumSmInk60}>Currency</Text>
        <View style={styles.currencyBlock}>
          <Text style={styles.currencyLabel}>{currency}</Text>
          <Text style={styles.currencyHint}>Currency can&apos;t be changed after creation.</Text>
        </View>
      </View>
    </>
  );
}
