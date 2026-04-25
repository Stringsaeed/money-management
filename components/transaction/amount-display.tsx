import { useWindowDimensions } from "react-native";
import { Host, HStack, Text as SwiftUIText } from "@expo/ui/swift-ui";
import {
  Animation,
  animation,
  contentTransition,
  font,
  foregroundStyle,
  frame,
  monospacedDigit,
} from "@expo/ui/swift-ui/modifiers";
import { useNativeVariable } from "react-native-css";
import useNumPadNumber from "@/hooks/use-num-pad-number";

interface AmountDisplayProps {
  currencySymbol: string;
  value: string;
  numPadConfig: ReturnType<typeof useNumPadNumber>;
}

export function AmountDisplay({ currencySymbol, value, numPadConfig }: AmountDisplayProps) {
  const { width } = useWindowDimensions();

  const integralPart = Math.floor(numPadConfig.value);
  const fractionalPart = Math.round((numPadConfig.value - integralPart) * 100);

  // @ts-expect-error - This is an unstable API and may change in the future
  const colorInk = useNativeVariable("--color-ink");
  // @ts-expect-error - This is an unstable API and may change in the future
  const colorMutedForeground = useNativeVariable("--color-muted-foreground");

  return (
    <Host matchContents>
      <HStack
        alignment="lastTextBaseline"
        modifiers={[
          frame({
            width: width,
            height: 60,
            alignment: "center",
          }),
          animation(Animation.easeInOut(), integralPart),
        ]}
      >
        <SwiftUIText
          modifiers={[
            monospacedDigit(),
            contentTransition("numericText"),
            font({
              family: "Newsreader-Regular",
              size: 35,
            }),
            foregroundStyle(colorInk),
          ]}
        >
          {currencySymbol}
        </SwiftUIText>
        <SwiftUIText
          modifiers={[
            monospacedDigit(),
            contentTransition("numericText"),
            font({
              family: "Newsreader-Regular",
              size: 52,
            }),
            animation(
              Animation.spring({
                response: 0.4,
                dampingFraction: 0.6,
                duration: 500,
              }),
              integralPart,
            ),
            foregroundStyle(colorInk),
          ]}
        >
          {integralPart}
        </SwiftUIText>
        <SwiftUIText
          modifiers={[
            contentTransition("opacity"),
            font({
              family: "Newsreader-Regular",
              size: 35,
            }),
            animation(Animation.easeInOut(), numPadConfig.isDecimal),
            foregroundStyle(numPadConfig.isDecimal ? colorInk : colorMutedForeground),
          ]}
        >
          .
        </SwiftUIText>
        <SwiftUIText
          modifiers={[
            monospacedDigit(),
            contentTransition("numericText"),
            font({
              family: "Newsreader-Regular",
              size: 35,
            }),
            animation(
              Animation.spring({
                response: 0.4,
                dampingFraction: 0.6,
                duration: 500,
              }),
              fractionalPart,
            ),
            foregroundStyle(fractionalPart ? colorInk : colorMutedForeground),
          ]}
        >
          {fractionalPart.toString().padStart(2, "0")}
        </SwiftUIText>
      </HStack>
    </Host>
  );
}
