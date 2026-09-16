import { useEffect, useRef, useState } from "react";
import { TextInput } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { styles } from "@/components/envelopes/styles";
import { Text } from "@/components/ui/text";
import { parseSetupAssignment } from "@/modules/budgeting/setup-assignment";
import { centsToDecimalString } from "@/utils/currency";

interface SetupAssignmentInputProps {
  amountMinor: number;
  envelopeName: string;
  onChange: (amountMinor: number) => void;
}

export const SetupAssignmentInput = ({
  amountMinor,
  envelopeName,
  onChange,
}: SetupAssignmentInputProps) => {
  const [value, setValue] = useState(() => centsToDecimalString(amountMinor));
  const [error, setError] = useState<string | null>(null);
  const [hasUncommittedInput, setHasUncommittedInput] = useState(false);
  const previousAmountMinor = useRef(amountMinor);

  useEffect(() => {
    if (previousAmountMinor.current === amountMinor) return;
    previousAmountMinor.current = amountMinor;
    if (!hasUncommittedInput) setValue(centsToDecimalString(amountMinor));
  }, [amountMinor, hasUncommittedInput]);

  const handleChangeText = (nextValue: string) => {
    setValue(nextValue);
    setHasUncommittedInput(true);
  };

  const handleEndEditing = () => {
    const parsed = parseSetupAssignment(value);
    if (!parsed.valid) {
      setError(parsed.message);
      return;
    }
    setError(null);
    setValue(centsToDecimalString(parsed.amountMinor));
    setHasUncommittedInput(false);
    onChange(parsed.amountMinor);
  };

  return (
    <Animated.View layout={LinearTransition} style={styles.gap1}>
      <Text style={styles.sectionLabel}>Optional initial Assignment</Text>
      <TextInput
        accessibilityLabel={`${envelopeName} initial Assignment`}
        inputMode="decimal"
        onChangeText={handleChangeText}
        onEndEditing={handleEndEditing}
        style={styles.assignmentInput}
        value={value}
      />
      {error ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
          <Text selectable style={styles.textDestructive}>
            {error}
          </Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};
