# Keep Envelope assignments outside the ledger

Envelope Assignments and moves are budget-only records with their own audit history; they do not create Transactions or change Account balances. Treating Envelopes as virtual Accounts would conflate where Money is held with why it is reserved, while storing only current balances would lose explainable history.
