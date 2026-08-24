import { TextInput, View } from "react-native";

import type { EditableField } from "@/components/rejected-changes/payload-fields";
import { Text } from "@/components/ui/text";

interface RejectedChangeEditFormProps {
  fields: readonly EditableField[];
  onFieldChange: (key: string, value: string) => void;
}

/**
 * The pre-populated re-edit form (#94): one input per editable field of the
 * original payload, seeded with its original values.
 */
export function RejectedChangeEditForm({ fields, onFieldChange }: RejectedChangeEditFormProps) {
  if (fields.length === 0) {
    return (
      <Text className="font-body-normal text-sm text-ink/50">
        This change has no editable values — resubmit it as-is or go back and discard it.
      </Text>
    );
  }
  return (
    <View className="gap-4">
      {fields.map((field) => (
        <View key={field.key} className="gap-1.5">
          <Text className="font-body-medium text-xs uppercase tracking-wider text-ink/50">
            {field.key}
          </Text>
          <TextInput
            className="rounded-xl border border-ledger-outline bg-surface-container px-3 py-2.5 font-body-normal text-base text-ink"
            value={field.value}
            onChangeText={(value) => onFieldChange(field.key, value)}
            autoCapitalize="none"
            testID={`edit-field-${field.key}`}
          />
        </View>
      ))}
    </View>
  );
}
