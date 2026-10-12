import { useRef } from "react";
import type { TextInput } from "react-native";

/**
 * The amount inputs of Plan amounts by item key, so the keyboard done bar's arrows move to the
 * previous or next row (`order` is every row, top to bottom).
 */
export function useAmountFields(order: readonly string[]) {
  const inputs = useRef(new Map<string, TextInput>());
  const focusAt = (index: number) => {
    const key = order[index];
    if (key !== undefined) inputs.current.get(key)?.focus();
  };

  return {
    fieldRef: (key: string) => (input: TextInput | null) => {
      if (input) inputs.current.set(key, input);
      else inputs.current.delete(key);
    },
    onPrevious: (key: string) => {
      const index = order.indexOf(key);
      return index > 0 ? () => focusAt(index - 1) : undefined;
    },
    onNext: (key: string) => {
      const index = order.indexOf(key);
      return index >= 0 && index < order.length - 1 ? () => focusAt(index + 1) : undefined;
    },
  };
}
