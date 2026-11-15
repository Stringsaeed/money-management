import { AmountGroup } from "./amount-group";
import { LeftToPlanSlip } from "./left-to-plan-slip";
import { figure, itemHint } from "./setup-copy";
import { itemEmoji } from "./setup-emoji";
import { suggestedAmounts } from "./setup-items";
import { plannedMinor } from "./setup-plan";
import { GROUP_ORDER } from "./setup-types";
import { StepTitle } from "./step-title";
import { useAmountFields } from "./use-amount-fields";
import type { SetupModel } from "./use-setup-model";

/** S4's content: the Left to plan slip, then each group's amount rows. */
export function AmountsPlan({ model }: { readonly model: SetupModel }) {
  const { currency, draft, setup, categories, ticked, preview } = model;
  const fields = useAmountFields(ticked.map((item) => item.key));

  return (
    <>
      <StepTitle title="Plan amounts" />
      <LeftToPlanSlip
        currency={currency}
        cashMinor={preview?.cashMinor ?? null}
        leftMinor={preview?.leftToPlanMinor ?? null}
        onSuggest={() =>
          setup.update({ amounts: { ...draft.amounts, ...suggestedAmounts(ticked, currency) } })
        }
        onClear={() => setup.update({ amounts: {} })}
      />
      {GROUP_ORDER.map((group) => {
        const rows = ticked.filter((item) => item.group === group);
        if (rows.length === 0) return null;
        const total = rows.reduce(
          (sum, item) => sum + plannedMinor(item, draft.amounts, currency),
          0,
        );
        return (
          <AmountGroup
            key={group}
            group={group}
            total={figure(total, currency)}
            currency={currency}
            rows={rows.map((item) => ({
              key: item.key,
              emoji: itemEmoji(item, categories.data),
              name: item.name,
              hint: itemHint(item, currency),
              value: draft.amounts[item.key] ?? "",
            }))}
            onChange={(key, text) => setup.update({ amounts: { ...draft.amounts, [key]: text } })}
            {...fields}
          />
        );
      })}
    </>
  );
}
