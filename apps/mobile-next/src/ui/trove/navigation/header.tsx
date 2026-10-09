import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { colors, layout, space } from "../tokens";
import { HeaderActionButton, type HeaderAction } from "./header-action-button";

interface HeaderBaseProps {
  title: string;
  /** Icon-only trailing buttons, e.g. search and filter. */
  actions?: readonly HeaderAction[];
}

export interface LargeHeaderProps extends HeaderBaseProps {
  variant?: "large";
}

export interface CompactHeaderProps extends HeaderBaseProps {
  variant: "compact";
  /** Shows the back chevron when provided. */
  onBack?: () => void;
}

export type HeaderProps = LargeHeaderProps | CompactHeaderProps;

/**
 * Screen header. `large` is the tab-root title (`display`, with neutral action discs);
 * `compact` is the 44pt pushed-screen bar (back, centered title, bare trailing icons).
 * Horizontal gutter is the screen's job.
 */
export function Header(props: HeaderProps) {
  if (props.variant === "compact") return <CompactHeader {...props} />;
  return <LargeHeader {...props} />;
}

function LargeHeader({ title, actions = [] }: LargeHeaderProps) {
  return (
    <View style={styles.large}>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={styles.largeTitle}
        variant="display"
      >
        {title}
      </Text>
      <View style={styles.actions}>
        {actions.map((action) => (
          <HeaderActionButton key={action.label} {...action} appearance="filled" />
        ))}
      </View>
    </View>
  );
}

function CompactHeader({ title, actions = [], onBack }: CompactHeaderProps) {
  // Equal side slots keep the title centered whichever side carries more buttons.
  const slotWidth = layout.minTouchTarget * Math.max(1, actions.length);

  return (
    <View style={styles.compact}>
      <View style={[styles.slot, styles.slotStart, { width: slotWidth }]}>
        {onBack ? (
          <HeaderActionButton
            align="start"
            appearance="plain"
            icon="chevron-left"
            label="Back"
            onPress={onBack}
          />
        ) : null}
      </View>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={styles.compactTitle}
        variant="titleSm"
      >
        {title}
      </Text>
      <View style={[styles.slot, styles.slotEnd, { width: slotWidth }]}>
        {actions.map((action, index) => (
          <HeaderActionButton
            key={action.label}
            {...action}
            align={index === actions.length - 1 ? "end" : "center"}
            appearance="plain"
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  large: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    justifyContent: "space-between",
    minHeight: layout.minTouchTarget,
  },
  largeTitle: { flexShrink: 1 },
  actions: { flexDirection: "row", gap: space[1] },
  compact: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    height: layout.minTouchTarget + space[2],
    paddingBottom: space[2],
  },
  slot: { flexDirection: "row" },
  slotStart: { justifyContent: "flex-start" },
  slotEnd: { justifyContent: "flex-end" },
  compactTitle: { flex: 1, textAlign: "center" },
});
