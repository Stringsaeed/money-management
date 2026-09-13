# Production Postgres migrations

Production schema changes run only from the manually dispatched
`Migrate production Postgres schema` workflow. The Worker deploy performs its
own strict read-only schema check and never applies DDL.

## One-time setup

Complete this setup before dispatching the workflow:

1. In [PlanetScale service tokens](https://planetscale.com/docs/cli/service-tokens),
   create a token from **Settings -> Service tokens**.
   Copy both the token ID and plaintext token when they are shown, and set an
   expiry/TTL. Grant only database access to the production database with
   `connect_production_branch`. Do not grant organization-wide database access,
   role-management access, or access to another database. PlanetScale documents
   this as a database-scoped permission in its [service-token API
   reference](https://planetscale.com/docs/api/reference/service-tokens).
2. In GitHub, create the `prod-schema` environment. Add the maintainer as a
   required reviewer and restrict deployments to `main`. Leave GitHub's
   **Prevent self-review** option off for a solo maintainer so the run can be
   approved; enable it when a second reviewer is available.
   Do not add secrets until those protection rules are in place. This separate
   environment keeps owner-capable migration credentials out of the existing
   application `prod` environment.
3. Add these values to `prod-schema`:

   - Secret `PLANETSCALE_SERVICE_TOKEN_ID`: the service-token ID.
   - Secret `PLANETSCALE_SERVICE_TOKEN`: the plaintext service-token value.
   - Variable `PLANETSCALE_ORG`: the PlanetScale organization name.
   - Variable `PLANETSCALE_DATABASE`: `trove` (or the exact production database
     name if it changes).

The workflow fails before invoking `pscale` when any value is missing. It does
not use the Worker's `PLANETSCALE_USER` or `PLANETSCALE_PASSWORD`, and it never
grants the app role administrative privileges.

## Add and run a migration

The current journal ends at `0015`; those migrations are already in production
and must not be replayed. For the next change, generate or add a migration so
Drizzle records an exact `0016_<slug>` tag in
`packages/db/src/migrations/meta/_journal.json` and writes the matching
`0016_<slug>.sql` file. Future versions must increase monotonically.

After the reviewed change is merged to `main`:

1. Open **Actions -> Migrate production Postgres schema**.
2. Enter the exact journal tag, such as `0016_add_feature` (without `.sql`).
3. Review the migration diff and `prod-schema` approval request before
   approving it.

The action accepts a tag only; it accepts no SQL text or branch input. The
runner reads the matching journal file, computes its SHA-256, and invokes:

```text
pscale sql <database> main --org <organization> --format json --role admin --dbname postgres --query <checked-in migration>
```

For PostgreSQL, PlanetScale's [`pscale sql`](https://planetscale.com/docs/cli/sql)
`admin` access mints a short-lived role that inherits the administrative
`postgres` role, as described in [Postgres role management](https://planetscale.com/docs/postgres/connecting/roles).
The runner sends service-token credentials through the process environment, not
command arguments.

Each invocation wraps the migration in one transaction, takes a PostgreSQL
advisory lock, and records `(version, tag, sha256, applied_at)` in
`trove_schema_migrations`. A retry with the same tag and file checksum is a
no-op. If the file content changes after a version was applied, the transaction
fails closed on checksum drift. Transaction-control statements and
`CREATE/DROP INDEX CONCURRENTLY` are rejected because they cannot be safely
wrapped in the runner transaction.

If a checked-in migration contains `DELETE`, `DROP`, or `TRUNCATE`, the runner
passes PlanetScale's `--force` guard. That is still limited to the journal
allowlist and must be explicitly reviewed by the protected environment
reviewer. Never paste destructive SQL into a workflow input.
