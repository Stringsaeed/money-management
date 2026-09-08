import { useRef, useState, type ReactNode } from "react";
import { Pressable, Text as RNText, TextInput as RNTextInput, View } from "react-native";

function Box({ children }: { children?: ReactNode }) {
  return <View>{children}</View>;
}

export const Host = Box;
export const Column = Box;
export const Row = Box;
export const ScrollView = Box;
export const RNHostView = Box;

export function BottomSheet({
  isPresented,
  children,
  onDismiss,
  testID,
}: {
  isPresented?: boolean;
  children?: ReactNode;
  onDismiss?: () => void;
  testID?: string;
}) {
  if (!isPresented) return null;
  return (
    <View testID={testID}>
      {children}
      {onDismiss ? (
        <Pressable
          accessibilityLabel="Dismiss sheet"
          accessibilityRole="button"
          onPress={onDismiss}
        />
      ) : null}
    </View>
  );
}

export function Text({ children }: { children?: string }) {
  return <RNText>{children}</RNText>;
}

export function Button({
  label,
  onPress,
  disabled,
  children,
  testID,
}: {
  label?: string;
  onPress?: () => void;
  disabled?: boolean;
  children?: ReactNode;
  testID?: string;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} testID={testID} accessibilityRole="button">
      {children ?? <RNText>{label}</RNText>}
    </Pressable>
  );
}

export function TextInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  editable,
  testID,
}: {
  value?: { value: string };
  onChangeText?: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  editable?: boolean;
  testID?: string;
}) {
  return (
    <RNTextInput
      value={value?.value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      editable={editable}
      testID={testID}
    />
  );
}

export function useNativeState<T>(initialValue: T) {
  const [val, setVal] = useState(initialValue);
  const valRef = useRef(val);
  valRef.current = val;
  const stateRef = useRef<{ value: T } | null>(null);
  if (stateRef.current === null) {
    stateRef.current = {
      get value() {
        return valRef.current;
      },
      set value(next: T) {
        valRef.current = next;
        setVal(next);
      },
    };
  }
  return stateRef.current;
}
