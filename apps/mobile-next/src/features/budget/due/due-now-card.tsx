import { StyleSheet, Text as NativeText, View } from "react-native";

import type { V2Account, V2DueOccurrence } from "@trove/api/v2/contracts";

import {
  CategoryTile,
  colors,
  DENSE_MAX_FONT_SCALE,
  FlowButton,
  fonts,
  radius,
  space,
  Text,
} from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import { accountTypeOption } from "../../ledger/accounts/account-display";

import type { ToneCopy } from "./due-copy";
import { paymentDateLabel } from "./due-display";
import { DuePaymentRows } from "./due-payment-rows";
import { useMarkPaidForm } from "./use-mark-paid-form";

interface DueNowCardProps {
  readonly item: V2DueOccurrence;
  /** Today's bills wear the warning stripe; overdue ones the negative one. */
  readonly late: boolean;
  readonly icon: string | null;
  readonly sub: ToneCopy;
  /** Bare figure, e.g. "1,850.00". */
  readonly figure: string;
  /** Where it can be paid from; see `markPaidAccounts`. */
  readonly accounts: readonly V2Account[];
  readonly today: string;
  readonly muted: boolean;
  /** Absent for a read-only viewer. */
  readonly onChange?: () => void;
  readonly onSkip?: () => void;
  readonly onSnooze: () => void;
  readonly canPay: boolean;
}

/**
 * A bill due now: what it is, the payment as it will be recorded (amount, account, today), and
 * Mark paid. Changing any of it opens the Mark paid sheet; Mark paid here records it as shown.
 */
export function DueNowCard(props: DueNowCardProps) {
  const { item, late, icon, sub, figure, accounts, today, muted, canPay } = props;
  const form = useMarkPaidForm({ item, accounts, today, onPaid: () => undefined });
  const account = accounts.find((choice) => choice.id === form.accountId);
  const fields = [
    { label: "Amount", value: formatMoneyMinor(item.amountMinor, item.currency) },
    {
      label: "From",
      value: account ? `${accountTypeOption(account.type).emoji} ${account.name}` : "Choose",
    },
    { label: "Date", value: paymentDateLabel(form.date, today) },
  ];
  return (
    <View
      accessibilityLabel={`${item.name}, ${figure}. ${sub.text}${muted ? ". Reminders muted" : ""}`}
      style={[styles.card, late ? styles.late : styles.today]}
    >
      <View accessible style={styles.top}>
        {icon ? <CategoryTile icon={icon} round /> : <CategoryTile kind="expense" />}
        <View style={styles.copy}>
          <NativeText
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            numberOfLines={1}
            style={styles.name}
          >
            {item.name}
          </NativeText>
          <NativeText
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            numberOfLines={2}
            style={[styles.sub, sub.tone === "warning" ? styles.subWarn : null]}
          >
            {sub.text}
          </NativeText>
        </View>
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.figure}>
          {figure}
        </NativeText>
      </View>
      <DuePaymentRows fields={fields} onChange={canPay ? props.onChange : undefined} />
      {form.error ? (
        <Text accessibilityRole="alert" style={styles.centered} tone="negative" variant="labelMd">
          {form.error}
        </Text>
      ) : null}
      {canPay ? (
        <FlowButton
          label="Mark paid"
          loading={form.busy}
          onPress={() => void form.submit()}
          size="pair"
        />
      ) : null}
      <View style={styles.links}>
        <FlowButton label="Snooze 1 day" onPress={props.onSnooze} size="link" tone="text" />
        {props.onSkip ? (
          <FlowButton label="Skip this month" onPress={props.onSkip} size="link" tone="text" />
        ) : null}
      </View>
    </View>
  );
}

/** Board: 16pt inside; the 4pt stripe and 1pt ring are drawn as borders, so they come off it. */
const STRIPE = 4;
const RING = 1;
const INSET = 16;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderLeftWidth: STRIPE,
    borderRadius: radius.lg,
    borderWidth: RING,
    gap: space[3],
    paddingBottom: INSET - RING,
    paddingLeft: INSET - STRIPE,
    paddingRight: INSET - RING,
    paddingTop: INSET - RING,
  },
  today: { borderLeftColor: colors.warning.text },
  late: { borderLeftColor: colors.negative.text },
  top: { alignItems: "center", flexDirection: "row", gap: space[3] },
  copy: { flex: 1, minWidth: 0 },
  name: { color: colors.text.primary, fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 22 },
  sub: { color: colors.text.tertiary, fontFamily: fonts.mono, fontSize: 11, lineHeight: 15 },
  subWarn: { color: colors.warning.text },
  figure: {
    color: colors.text.primary,
    fontFamily: fonts.monoMedium,
    fontSize: 17,
    lineHeight: 22,
  },
  centered: { textAlign: "center" },
  links: { flexDirection: "row", justifyContent: "center" },
});
