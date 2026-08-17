# Commit ledger and budget writes atomically

Any action that changes both ledger and budget facts—including Refunds, Card Payments, and resource archival—commits in one SQLite transaction, with cache-coherence effects emitted only after commit. Asynchronous repair would expose partially updated financial truth, while optimistic budget persistence could misrepresent a ledger write that later fails.
