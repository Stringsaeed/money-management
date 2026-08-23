# Keep the ledger local-first while adding a server household shell

Household and authentication now exist server-side (better-auth on Cloudflare D1, oRPC procedures for households, memberships, and invite codes), while every financial record — Accounts, Categories, Transactions, Recurring Rules, budgets — remains local-only in device SQLite. Local tables gain a nullable `owner_user_id` column as forward-prep, but no data is backfilled or uploaded.

Moving ledger data server-authoritatively now would force an entire sync architecture (outbox, change feed, conflict resolution) before any user value exists, and would break the offline-first guarantee the app is built on. Deferring sharing keeps this milestone small while leaving the path open: `packages/protocol` already defines the command envelope, effect tags, and sync watermark that a future shared-ledger milestone will adopt, and the nullable ownership columns let existing local rows be claimed by their signing-in User without migration.

The cost is a temporary split: identity lives on the server, money lives on device. Household screens therefore manage only people — members, roles, invites — never shared finances.
