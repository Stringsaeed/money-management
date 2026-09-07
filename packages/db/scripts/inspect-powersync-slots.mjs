import postgres from "postgres";

const databaseUrl = process.env.Z6_DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("Z6_DATABASE_URL is required.");
const connectionUrl = new URL(databaseUrl);
connectionUrl.searchParams.delete("sslrootcert");
const sql = postgres(connectionUrl.toString(), { max: 1, ssl: "prefer" });

try {
  const rows = await sql`
    SELECT
      slot_name,
      active,
      active_pid,
      database,
      wal_status,
      restart_lsn::text,
      confirmed_flush_lsn::text,
      pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)::text AS lag_bytes,
      replication.application_name,
      replication.client_addr::text
    FROM pg_replication_slots slots
    LEFT JOIN pg_stat_replication replication ON replication.pid = slots.active_pid
    ORDER BY slot_name
  `;
  console.log(JSON.stringify({ observedAt: new Date().toISOString(), slots: rows }, null, 2));
} finally {
  await sql.end();
}
