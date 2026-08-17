# Derive budget projections from durable facts

The database stores durable budget facts—Envelopes, period-aware mappings and memberships, append-only Assignments, Refund links, settings, and lifecycle changes—while Available Money, Rollovers, Card Payment Reserves, and monthly summaries are derived from those facts plus the ledger. Persisting mutable monthly balances would create a second financial authority that historical corrections could leave inconsistent.
