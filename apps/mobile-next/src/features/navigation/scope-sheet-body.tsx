import { StyleSheet, Text as NativeText, View } from "react-native";

import type { V2LedgerScope } from "@trove/api/v2/contracts";

import { useSession } from "@/features/auth/use-session";
import { useBudgetingEnabled } from "@/features/feature-flags";
import type { HouseholdDetail } from "@/features/household/household-client";
import { Banner, colors, fonts, SheetLinkGroup, type SheetLinkItem } from "@/ui/trove";

import { ScopeNote } from "./scope-note";
import { ScopeOptions } from "./scope-options";
import { ScopeOptionsWithSafe } from "./scope-options-with-safe";
import { membersMeta, otherMemberNames, scopeNote } from "./scope-sheet-copy";

interface ScopeSheetBodyProps {
  readonly scope: V2LedgerScope;
  readonly household: HouseholdDetail | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly onSelect: (scope: V2LedgerScope) => void;
  readonly onOpenHousehold: () => void;
  readonly onOpenSettings: () => void;
}

/** H1 "Which ledger?": the two ledgers, what switching means, and Household and Settings. */
export function ScopeSheetBody({
  scope,
  household,
  loading,
  error,
  onSelect,
  onOpenHousehold,
  onOpenSettings,
}: ScopeSheetBodyProps) {
  const budgeting = useBudgetingEnabled();
  const { principal } = useSession();
  const myUserId = principal?.kind === "user" ? principal.userId : null;
  const others = household ? otherMemberNames(household, myUserId) : [];
  const options = { scope, household, loading, others, onSelect };
  const settings: SheetLinkItem = { emoji: "⚙️", label: "Settings", onPress: onOpenSettings };
  const links: SheetLinkItem[] = household
    ? [
        {
          emoji: "👥",
          label: "Household members",
          meta: membersMeta(others),
          onPress: onOpenHousehold,
        },
        settings,
      ]
    : [settings];
  return (
    <View style={styles.body}>
      <NativeText accessibilityRole="header" style={styles.title}>
        Which ledger?
      </NativeText>
      {budgeting ? (
        <ScopeOptionsWithSafe {...options} />
      ) : (
        <ScopeOptions {...options} activeSafe={null} />
      )}
      {!loading && !household ? (
        <Banner
          actionLabel="Open household"
          message={error ?? "Create or join a household to share a ledger."}
          onAction={onOpenHousehold}
          tone={error ? "negative" : "neutral"}
        />
      ) : null}
      <ScopeNote text={scopeNote(household !== null, others)} />
      <SheetLinkGroup links={links} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Sheet content pads 8 top / 24 bottom under the native grabber; the board pads 12 / 34.
  body: { gap: 14, paddingBottom: 10, paddingTop: 4 },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.extrabold,
    fontSize: 24,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
});
