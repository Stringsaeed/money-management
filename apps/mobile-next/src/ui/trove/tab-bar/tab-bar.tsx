import { StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReducedMotion } from "../../motion";
import { Icon } from "../icon";
import { colors, space } from "../tokens";
import { BOTTOM_OFFSET } from "./constants";
import { TAB_BAR_GLASS } from "./glass";
import { RoundButton } from "./round-button";
import { ScopeButton } from "./scope-button";
import { TabBarRow } from "./tab-bar-row";
import { TabPill } from "./tab-pill";
import type { TabBarKey, TabBarScope, TabBarTab } from "./types";
import { roundButtonCount, tabBarLayout } from "./utils";

export interface TabBarProps {
  tabs: readonly TabBarTab[];
  /**
   * Called for every tab press, including the active one (re-tap scrolls to top), and once
   * when a selector drag is released over another tab.
   */
  onTabPress: (key: TabBarKey) => void;
  onAdd: () => void;
  /** Current ledger scope; the scope button shows 👤 or 🏠. */
  scope?: TabBarScope;
  /** Shows the round scope button, typically opening the ledger and settings sheet. */
  onScopePress?: () => void;
  /** True while the scope menu is open (reported to screen readers). */
  scopeExpanded?: boolean;
  scopeLabel?: string;
  /** Long press on Add, e.g. to start a transfer. */
  onAddLongPress?: () => void;
  addLabel?: string;
}

/**
 * Floating navigation (Tab bar v3): an icon-only pill of tabs with a draggable selector, an
 * optional round scope button and a round accent Add button, 8pt above the safe-area inset.
 * On Liquid Glass all three are interactive glass in one glass group.
 * Business actions come in as props.
 */
export function TabBar({
  tabs,
  onTabPress,
  onAdd,
  scope = "personal",
  onScopePress,
  scopeExpanded,
  scopeLabel,
  onAddLongPress,
  addLabel = "Add spending",
}: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const { tabWidth, sideGap } = tabBarLayout(
    windowWidth - insets.left - insets.right,
    tabs.length,
    roundButtonCount(onScopePress),
  );

  return (
    <TabBarRow
      style={[
        styles.wrap,
        {
          gap: sideGap,
          paddingBottom: insets.bottom + BOTTOM_OFFSET,
          paddingLeft: insets.left + space[1],
          paddingRight: insets.right + space[1],
        },
      ]}
    >
      <TabPill
        onTabPress={onTabPress}
        reducedMotion={reducedMotion}
        tabWidth={tabWidth}
        tabs={tabs}
      />
      {onScopePress ? (
        <ScopeButton
          expanded={scopeExpanded}
          label={scopeLabel}
          onPress={onScopePress}
          scope={scope}
        />
      ) : null}
      <RoundButton label={addLabel} onLongPress={onAddLongPress} onPress={onAdd} variant="accent">
        <Icon
          color={TAB_BAR_GLASS ? colors.accent.text : colors.accent.on}
          name="add"
          size={26}
          strokeWidth={2.25}
        />
      </RoundButton>
    </TabBarRow>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
  },
});
