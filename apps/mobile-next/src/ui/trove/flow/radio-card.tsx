import type { ReactNode } from "react";

import { PressableScale } from "../pressable-scale";
import { RadioCardLgBody } from "./radio-card-lg-body";
import { RadioCardMdBody } from "./radio-card-md-body";
import {
  cardStyles,
  layoutStyles,
  radioCardBody,
  type RadioCardSize,
  type RadioCardSubTone,
} from "./radio-card-styles";
import { RadioDot } from "./radio-dot";

export type { RadioCardSize, RadioCardSubTone } from "./radio-card-styles";

export interface RadioCardProps {
  title: string;
  sub?: string;
  emoji?: string;
  /** text: Nunito sentence · mono: Plex Mono caps line, e.g. "AFTER: 555". md only; lg is always text. */
  subStyle?: "text" | "mono";
  /** Defaults to tertiary for mono and secondary for text. */
  subTone?: RadioCardSubTone;
  /** md only: mono figure on the right, e.g. what is left in the source ("730"). */
  trailing?: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  /**
   * md: 54pt source row (cover from), title Nunito 700 15 · lg: roomy choice card (leftovers),
   * emoji inline with an 800 16 title, a 14pt sentence, and room for `children`.
   */
  size?: RadioCardSize;
  /** lg only: extra control under the sentence, e.g. a picker chip. */
  children?: ReactNode;
  /** Defaults to "title, sub, trailing". */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

/** Single-choice card: radio mark, title and sub line; accent-tinted with an accent ring when selected. */
export function RadioCard({
  title,
  sub,
  emoji,
  subStyle = "text",
  subTone,
  trailing,
  selected,
  onPress,
  disabled = false,
  size = "md",
  children,
  accessibilityLabel = [title, sub, trailing].filter(Boolean).join(", "),
  accessibilityHint,
  testID,
}: RadioCardProps) {
  const lg = size === "lg";

  return (
    <PressableScale
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      pressedStyle={selected ? null : cardStyles.pressed}
      style={radioCardBody(size, selected, disabled)}
      testID={testID}
    >
      <RadioDot selected={selected} style={lg ? layoutStyles.dotLg : null} />
      {lg ? (
        <RadioCardLgBody emoji={emoji} sub={sub} subTone={subTone} title={title}>
          {children}
        </RadioCardLgBody>
      ) : (
        <RadioCardMdBody
          emoji={emoji}
          mono={subStyle === "mono"}
          sub={sub}
          subTone={subTone}
          title={title}
          trailing={trailing}
        />
      )}
    </PressableScale>
  );
}
