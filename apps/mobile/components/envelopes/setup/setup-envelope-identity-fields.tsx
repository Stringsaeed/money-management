import { View } from "react-native";

import type { SetupDraftEnvelope } from "@/modules/budgeting/budgeting";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form";

interface SetupEnvelopeIdentityFieldsProps {
  currency: string;
  envelope: SetupDraftEnvelope;
  onChange: (changes: Partial<SetupDraftEnvelope>) => void;
}

export const SetupEnvelopeIdentityFields = ({
  currency,
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
    <View className="gap-2">
      <form.Field name="name">
        {({ handleChange, state }) => (
          <Input
            accessibilityLabel={`${currency} Envelope name`}
            onChangeText={handleChange}
            onEndEditing={handleFieldEndEditing("name")}
            value={state.value}
          />
        )}
      </form.Field>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <form.Field name="icon">
            {(field) => (
              <Input
                accessibilityLabel={`${envelope.name} Envelope emoji`}
                onChangeText={field.handleChange}
                onEndEditing={handleFieldEndEditing("icon")}
                value={field.state.value}
              />
            )}
          </form.Field>
        </View>
        <View className="flex-1">
          <form.Field name="color">
            {(field) => (
              <Input
                autoCapitalize="characters"
                onChangeText={field.handleChange}
                onEndEditing={handleFieldEndEditing("color")}
                value={field.state.value}
              />
            )}
          </form.Field>
        </View>
      </View>
    </View>
  );
};
