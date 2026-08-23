-- Forward-prep for household claiming: records which signed-in user each
-- local row belongs to. Nullable — existing anonymous rows stay unclaimed
-- until a future sync/claim flow backfills them.
--
-- Note: recurring_rules is intentionally NOT altered here. That table is
-- created and rebuilt programmatically by db/recurring-rules-migration.ts
-- (it does not exist during fresh-install drizzle migrations), which adds
-- the owner_user_id column in its own CREATE TABLE.
ALTER TABLE accounts ADD COLUMN owner_user_id TEXT;
ALTER TABLE categories ADD COLUMN owner_user_id TEXT;
ALTER TABLE transactions ADD COLUMN owner_user_id TEXT;
