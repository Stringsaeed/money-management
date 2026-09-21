import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Sheet } from "@/ui/sheet";
import { SelectRow } from "@/ui/select-row";
import { Text } from "@/ui/text";
import { Button } from "@/ui/button";
import { Surface } from "@/ui/surface";
import { spacing } from "@/ui/design-tokens";

interface TransactionOptionSheetProps {
  readonly label: string;
  readonly value?: string;
  readonly options: readonly { id: string; label: string }[];
  readonly onChange: (id: string) => void;
}

export function TransactionOptionSheet({
  label,
  value,
  options,
  onChange,
}: TransactionOptionSheetProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SelectRow label={label} value={value} onPress={() => setOpen(true)} />
      <Sheet open={open} onDismiss={() => setOpen(false)}>
        <Text variant="title">{label}</Text>
        <View style={styles.options}>
          {options.map((option) => (
            <Surface key={option.id} variant="recessed">
              <Button
                title={option.label}
                variant="ghost"
                onPress={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
              />
            </Surface>
          ))}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({ options: { gap: spacing[2] } });
