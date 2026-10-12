import { StyleSheet, Text as NativeText, View } from "react-native";

import {
  CtaStack,
  DashedRule,
  FlowButton,
  LeaderLine,
  ReceiptNote,
  ReceiptSlip,
  ReceiptTotal,
  Text,
} from "@/ui/trove";

import { BudgetHeader } from "./home/budget-header";
import { PLAN_ADMIN_ONLY } from "./role/budget-role";

const STEPS = [
  { prefix: "01", label: "PAYDAY & MONEY", value: "1 MIN" },
  { prefix: "02", label: "WHAT IT'S FOR", value: "1 MIN" },
  { prefix: "03", label: "PLAN AMOUNTS", value: "1 MIN" },
] as const;

interface BudgetIntroProps {
  readonly hasDraft: boolean;
  /** False for a household member who is not the admin: only the admin starts the budget. */
  readonly canStart: boolean;
  /** The household role is still loading: show neither Start nor the admin-only message yet. */
  readonly roleLoading?: boolean;
  readonly onStart: () => void;
  readonly onNotNow: () => void;
}

/** S1: one pitch, the three steps on a receipt, and one way in. A saved draft continues setup. */
export function BudgetIntro({
  hasDraft,
  canStart,
  roleLoading = false,
  onStart,
  onNotNow,
}: BudgetIntroProps) {
  const notNow = { label: "Not now", onPress: onNotNow };
  return (
    <View style={styles.column}>
      <BudgetHeader stamp="NO BUDGET YET" />
      <View style={styles.pitch}>
        <NativeText
          accessibilityElementsHidden
          allowFontScaling={false}
          importantForAccessibility="no"
          style={styles.emoji}
        >
          ✉️
        </NativeText>
        <Text accessibilityRole="header" variant="titleLg">
          Know what you can spend until payday.
        </Text>
        <Text style={styles.body} tone="secondary">
          Give every dirham you have a job: bills, everyday, and the big ones like rent cheques and
          school terms. We&apos;ll show one number each day.
        </Text>
      </View>
      <View accessibilityLabel="Three steps">
        <ReceiptSlip gap={9}>
          {STEPS.map((step) => (
            <LeaderLine
              key={step.prefix}
              gap={8}
              label={step.label}
              prefix={step.prefix}
              value={step.value}
            />
          ))}
          <DashedRule />
          <ReceiptTotal label="TOTAL" value="≈ 3 MIN" />
          <ReceiptNote text="*** NO BANK CONNECTION NEEDED ***" />
        </ReceiptSlip>
      </View>
      {roleLoading ? (
        <FlowButton {...notNow} size="link" tone="text" />
      ) : canStart ? (
        <CtaStack
          link={notNow}
          primary={{ label: hasDraft ? "Continue setup" : "Start my budget", onPress: onStart }}
        />
      ) : (
        <View style={styles.refused}>
          <Text accessibilityRole="alert" style={styles.center} tone="secondary" variant="bodySm">
            {PLAN_ADMIN_ONLY}
          </Text>
          <FlowButton {...notNow} size="link" tone="text" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 20 },
  pitch: { gap: 8 },
  emoji: { fontSize: 40, lineHeight: 44 },
  body: { fontSize: 16, lineHeight: 23 },
  refused: { gap: 6 },
  center: { textAlign: "center" },
});
