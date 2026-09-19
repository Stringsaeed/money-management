import { View } from "react-native";

import { styles } from "@/components/envelopes/styles";
import { ColorPicker } from "@/components/common/color-picker";
import { EmojiPicker } from "@/components/common/emoji-picker";
import { Text } from "@/components/ui/text";

import type { UseEnvelopeFormReturn } from "./form";

interface EnvelopeAppearanceFieldsProps {
  form: UseEnvelopeFormReturn;
}

export function EnvelopeAppearanceFields({ form }: EnvelopeAppearanceFieldsProps) {
  return (
    <>
      <form.Field name="icon">
        {(field) => (
          <View style={styles.gap2}>
            <Text style={styles.textMediumSmInk60}>Emoji</Text>
            <EmojiPicker value={field.state.value} onChange={field.handleChange} />
          </View>
        )}
      </form.Field>

      <form.Field name="color">
        {(field) => (
          <View style={styles.gap2}>
            <Text style={styles.textMediumSmInk60}>Color</Text>
            <ColorPicker value={field.state.value} onChange={field.handleChange} />
          </View>
        )}
      </form.Field>
    </>
  );
}
