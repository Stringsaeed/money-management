# Extend the ledger coherence owner for budgeting

Budget projections and semantic effects join the existing ledger cache-coherence owner instead of introducing budgeting-specific query-key ownership in individual hooks. Account, Category, Transaction, Recurring Rule, Settlement, Refund, Assignment, and lifecycle changes can then refresh every affected ledger and budget projection through one dependency map.
