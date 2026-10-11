import { View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Banner } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import { attentionText, type Attention } from "./attention";

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** The single most important thing to look at, plus how many others wait behind it. */
export function AttentionLine({ attention }: { readonly attention: Attention }) {
  if (!attention.top) return null;
  const warning = attention.top.kind === "overspend";
  const text = attentionText(attention.top, money);
  const more = attention.moreCount > 0 ? `${attention.moreCount} more` : null;
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${warning ? "Needs attention: " : "Note: "}${text}${more ? `. ${more}` : ""}`}
    >
      <Banner
        message={more ? `${text} · ${more}` : text}
        title={warning ? "Over" : "Heads up"}
        tone={warning ? "negative" : "neutral"}
      />
    </View>
  );
}
