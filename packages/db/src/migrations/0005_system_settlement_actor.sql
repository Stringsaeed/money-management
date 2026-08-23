-- #88: system actor for scheduled settlement sweeps. household_changes
-- attributes every settlement-generated transaction to this user row, so
-- cron-driven writes are distinguishable from any human member's commands.
INSERT INTO "user" ("id", "name", "email", "email_verified")
VALUES ('user-system-settlement', 'Settlement Scheduler', 'system@settlement.local', 1)
ON CONFLICT ("id") DO NOTHING;
