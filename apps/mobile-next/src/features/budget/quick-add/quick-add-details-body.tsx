import { TextField } from "@/ui/trove";

import { CategoryChips } from "./category-chips";
import { PaidWithChips } from "./paid-with-chips";
import { QuickAddDatePicker } from "./quick-add-date-picker";
import type { QuickAddDetailsProps } from "./quick-add-panel";

/** The editor for one meta chip; picking a value hands back to the keypad. */
export function QuickAddDetailsBody(props: QuickAddDetailsProps) {
  const { panel, onDone } = props;
  switch (panel) {
    case "account":
      return (
        <PaidWithChips
          cards={props.cards}
          funding={props.funding}
          onAddCard={props.onAddCard}
          onSelect={(id) => {
            props.onAccount(id);
            onDone();
          }}
          selectedId={props.accountId}
        />
      );
    case "date":
      return (
        <QuickAddDatePicker
          date={props.date}
          onChange={(date) => {
            props.onDate(date);
            onDone();
          }}
        />
      );
    case "category":
      return (
        <CategoryChips
          categories={props.categories}
          onSelect={(id) => {
            props.onCategory(id);
            onDone();
          }}
          selectedId={props.categoryId}
        />
      );
    case "note":
      return (
        <TextField
          autoFocus
          label="Note (optional)"
          onChangeText={props.onNote}
          onSubmitEditing={onDone}
          returnKeyType="done"
          value={props.note}
        />
      );
  }
}
