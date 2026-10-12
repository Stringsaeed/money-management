import type { V2Account, V2Category } from "@trove/api/v2/contracts";

/** The detail editor open under the meta chips, in place of the keypad. */
export type QuickAddPanel = "account" | "date" | "category" | "note";

export interface QuickAddDetailsProps {
  readonly panel: QuickAddPanel;
  readonly funding: readonly V2Account[];
  readonly cards: readonly V2Account[];
  readonly accountId: string | null;
  readonly onAccount: (id: string) => void;
  readonly onAddCard: () => void;
  readonly date: string;
  readonly onDate: (date: string) => void;
  readonly categories: readonly V2Category[];
  readonly categoryId: string | null;
  readonly onCategory: (id: string) => void;
  readonly note: string;
  readonly onNote: (note: string) => void;
  /** Back to the keypad. */
  readonly onDone: () => void;
}
