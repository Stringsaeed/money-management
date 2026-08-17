# Migrate budgeting after Recurring Rules

An idempotent, transactional code-backed budgeting migration runs after the existing Recurring Rules migration and upgrades fresh, legacy, and current databases without resetting user data. Rebaselining the split migration history while introducing budgeting would combine two risky efforts; migration consolidation remains a separate architecture task.
