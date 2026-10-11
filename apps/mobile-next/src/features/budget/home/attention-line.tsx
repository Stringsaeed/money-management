import { View } from "react-native";

import { Banner } from "@/ui/trove";

import { useBudgetMoney } from "../currency/use-budget-currency";
import { attentionText, type Attention } from "./attention";

/** The single most important thing to look at, plus how many others wait behind it. */
export function AttentionLine({ attention }: { readonly attention: Attention }) {
  const money = useBudgetMoney();
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
