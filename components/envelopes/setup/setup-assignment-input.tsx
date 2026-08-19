import { useState } from "react";
import { TextInput } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
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

  const handleEndEditing = () => {
    const parsed = parseSetupAssignment(value);
    if (!parsed.valid) {
      setError(parsed.message);
      return;
    }
    setError(null);
    setValue(centsToDecimalString(parsed.amountMinor));
    onChange(parsed.amountMinor);
  };

  return (
    <Animated.View layout={LinearTransition} className="gap-1">
      <Text className="font-body-semibold text-xs uppercase tracking-wide text-ink/50">
        Optional initial Assignment
      </Text>
      <TextInput
        accessibilityLabel={`${envelopeName} initial Assignment`}
        className="h-11 rounded-xl bg-surface-container px-3 font-body-normal text-ink"
        inputMode="decimal"
        onChangeText={setValue}
        onEndEditing={handleEndEditing}
        value={value}
      />
      {error ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
          <Text selectable className="font-body-medium text-sm text-destructive">
            {error}
          </Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};

export function parseSetupAssignment(
  value: string,
): { valid: true; amountMinor: number } | { valid: false; message: string } {
  const trimmed = value.trim();
  if (trimmed === "") return { valid: true, amountMinor: 0 };
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    return {
      valid: false,
      message:
        "Enter a positive amount with no more than two decimal places, or clear it for zero.",
    };
  }
  const [whole, fraction = ""] = trimmed.split(".");
  const amountMinor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amountMinor)) {
    return {
      valid: false,
      message: "This Assignment is too large. Enter a smaller positive amount.",
    };
  }
  return { valid: true, amountMinor };
}
