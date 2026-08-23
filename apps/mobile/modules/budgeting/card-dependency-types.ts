export interface UnfundedCardEntry {
  accountId: string;
  envelopeId: string;
  remainingMinor: number;
}

export interface CardBudgetState {
  availability: Map<string, number>;
  balances: Map<string, number>;
  reserveByAccount: Map<string, number>;
  unreservedPaymentByAccount: Map<string, number>;
  unfunded: UnfundedCardEntry[];
}
