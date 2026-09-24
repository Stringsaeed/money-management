/** Escape hatches from the transaction form to create a missing account or category. */
export interface TransactionCreateActions {
  readonly onCreateAccount?: () => void;
  readonly onCreateCategory?: () => void;
}

/** Let the sheet finish closing before navigating so the new screen isn't presented under it. */
export const afterSheetCloses = (navigate: () => void) => setTimeout(navigate, 0);
