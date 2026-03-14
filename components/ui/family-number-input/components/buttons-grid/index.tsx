import { StyleSheet, View } from "react-native";

import { type FC, memo } from "react";

import { FontAwesome5 } from "@expo/vector-icons";

import { InputButton } from "./input-button";
import { Text } from "@/components/ui/text";

const items = [
  { label: 1 },
  { label: 2 },
  { label: 3 },
  { label: 4 },
  { label: 5 },
  { label: 6 },
  { label: 7 },
  { label: 8 },
  { label: 9 },
  { label: "." },
  { label: 0 },
  { label: "backspace" },
];

type ButtonsGridProps = {
  input: number;
  onUpdate: (value: number) => void;
  onBackspace?: (value: number) => void;
  onReset?: () => void;
  onMaxReached?: () => void;
};

const ButtonsGrid: FC<ButtonsGridProps> = memo(
  ({ input, onReset, onUpdate, onBackspace, onMaxReached }) => {
    return (
      <View style={styles.container}>
        {items.map(({ label }, index) => {
          return (
            <InputButton
              key={index}
              style={styles.input}
              onLongPress={() => {
                if (label === "backspace") {
                  onReset?.();
                  return;
                }
              }}
              onPress={() => {
                if (typeof label === "number") {
                  const newValue = +`${input}${label}`;
                  if (newValue.toString().length > 11) {
                    onMaxReached?.();
                    return;
                  }
                  onUpdate(+`${input}${label}`);
                  return;
                }
                if (label === "backspace") {
                  onBackspace?.(Math.floor(input / 10));
                  return;
                }
                if (label === ".") {
                  if (input.toString().includes(".")) {
                    return;
                  }
                  onUpdate(+(input.toString() + ".0"));
                }
              }}
            >
              {typeof label === "number" && <Text style={styles.number}>{label}</Text>}
              {label === "." && <Text style={styles.number}>.</Text>}
              {label === "backspace" && <FontAwesome5 name={label} size={24} />}
            </InputButton>
          );
        })}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  input: {
    alignItems: "center",
    height: "20%",
    justifyContent: "center",
    marginBottom: `${7 / 3}%`,
    marginLeft: `${7 / 3}%`,
    width: "30%",
  },
  number: {
    // color: "white",
    fontSize: 30,
    textAlign: "center",
  },
});

ButtonsGrid.displayName = "ButtonsGrid";

export { ButtonsGrid };
