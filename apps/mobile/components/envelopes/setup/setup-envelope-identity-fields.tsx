import { View } from "react-native";

import { styles } from "@/components/envelopes/styles";
import type { SetupDraftEnvelope } from "@/modules/budgeting/budgeting";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form";

interface SetupEnvelopeIdentityFieldsProps {
  envelope: SetupDraftEnvelope;
  onChange: (changes: Partial<SetupDraftEnvelope>) => void;
}

export const SetupEnvelopeIdentityFields = ({
  envelope,
  onChange,
}: SetupEnvelopeIdentityFieldsProps) => {
  const form = useForm({
    defaultValues: {
      name: envelope.name,
      icon: envelope.icon,
      color: envelope.color,
    },
  });

  const handleFieldEndEditing = (field: keyof typeof form.state.values) => () => {
    const value = form.getFieldValue(field);
    onChange({ [field]: value });
  };

  return (
    <View style={styles.gap2}>
      <form.Field name="name">
        {({ handleChange, state }) => (
          <Input
            accessibilityLabel={`${envelope.currency} Envelope name`}
            onChangeText={handleChange}
            onEndEditing={handleFieldEndEditing("name")}
            value={state.value}
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.values.name}>
        {(name) => (
          <View style={styles.flexRowGap2}>
            <View style={styles.flex1}>
              <form.Field name="icon">
                {(field) => (
                  <Input
                    accessibilityLabel={`${name} Envelope emoji`}
                    onChangeText={field.handleChange}
                    onEndEditing={handleFieldEndEditing("icon")}
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </View>
            <View style={styles.flex1}>
              <form.Field name="color">
                {(field) => (
                  <Input
                    accessibilityLabel={`${name} Envelope color`}
                    autoCapitalize="characters"
                    onChangeText={field.handleChange}
                    onEndEditing={handleFieldEndEditing("color")}
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </View>
          </View>
        )}
      </form.Subscribe>
    </View>
  );
};
