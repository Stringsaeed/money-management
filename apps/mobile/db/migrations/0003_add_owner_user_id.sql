-- Forward-prep for household claiming: records which signed-in user each
-- local row belongs to. Nullable — existing anonymous rows stay unclaimed
-- until a future sync/claim flow backfills them.
ALTER TABLE accounts ADD COLUMN owner_user_id TEXT;
ALTER TABLE categories ADD COLUMN owner_user_id TEXT;
ALTER TABLE transactions ADD COLUMN owner_user_id TEXT;
ALTER TABLE recurring_rules ADD COLUMN owner_user_id TEXT;
