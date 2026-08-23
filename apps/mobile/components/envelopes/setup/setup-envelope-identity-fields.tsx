import { useState } from "react";
import { TextInput, View } from "react-native";

import type { SetupDraftEnvelope } from "@/modules/budgeting/budgeting";

interface SetupEnvelopeIdentityFieldsProps {
  envelope: SetupDraftEnvelope;
  onChange: (changes: Partial<SetupDraftEnvelope>) => void;
}

export const SetupEnvelopeIdentityFields = ({
  envelope,
  onChange,
}: SetupEnvelopeIdentityFieldsProps) => {
  const [name, setName] = useState(envelope.name);
  const [icon, setIcon] = useState(envelope.icon);
  const [color, setColor] = useState(envelope.color);
  const handleNameEndEditing = () => onChange({ name });
  const handleIconEndEditing = () => onChange({ icon });
  const handleColorEndEditing = () => onChange({ color });
  return (
    <View className="gap-2">
      <TextInput
        accessibilityLabel={`${envelope.currency} Envelope name`}
        className="h-11 rounded-xl bg-surface-container px-3 font-heading-normal text-lg italic text-ink"
        onChangeText={setName}
        onEndEditing={handleNameEndEditing}
        value={name}
      />
      <View className="flex-row gap-2">
        <TextInput
          accessibilityLabel={`${name} Envelope emoji`}
          className="h-11 w-16 rounded-xl bg-surface-container px-3 text-center text-lg text-ink"
          onChangeText={setIcon}
          onEndEditing={handleIconEndEditing}
          value={icon}
        />
        <TextInput
          accessibilityLabel={`${name} Envelope color`}
          autoCapitalize="characters"
          className="h-11 flex-1 rounded-xl bg-surface-container px-3 font-body-normal text-ink"
          onChangeText={setColor}
          onEndEditing={handleColorEndEditing}
          value={color}
        />
      </View>
    </View>
  );
};
