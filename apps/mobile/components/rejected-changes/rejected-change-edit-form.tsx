import { StyleSheet, TextInput, View } from "react-native";

import type { EditableField } from "@/components/rejected-changes/payload-fields";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

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
      <Text style={styles.emptyHint}>
        This change has no editable values — resubmit it as-is or go back and discard it.
      </Text>
    );
  }
  return (
    <View style={styles.form}>
      {fields.map((field) => (
        <View key={field.key} style={styles.field}>
          <Text style={styles.fieldLabel}>{field.key}</Text>
          <TextInput
            style={styles.input}
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

const styles = StyleSheet.create({
  emptyHint: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.5,
  },
  form: {
    gap: spacing[4],
  },
  field: {
    gap: spacing[1.5],
  },
  fieldLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    textTransform: "uppercase",
    letterSpacing: typography.trackingWider,
    color: colors.ink,
    opacity: 0.5,
  },
  input: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textBase,
    color: colors.ink,
    borderCurve: "continuous",
  },
});
