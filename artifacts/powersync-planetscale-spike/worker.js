import postgres from "postgres";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export default {
  async fetch(request, env) {
    const sql = postgres(env.HYPERDRIVE.connectionString, { max: 1 });
    try {
      const url = new URL(request.url);
      if (url.pathname === "/select1") {
        const rows = await sql`SELECT 1 AS n`;
        return json({ n: rows[0].n, host: url.host });
      }
      if (url.pathname === "/insert") {
        const id = url.searchParams.get("id");
        const householdId = url.searchParams.get("household_id");
        const note = url.searchParams.get("note") ?? "spike";
        if (!id || !householdId) {
          return json({ error: "id and household_id are required" }, 400);
        }
        const rows = await sql`
          INSERT INTO transactions (id, household_id, note)
          VALUES (${id}, ${householdId}, ${note})
          RETURNING id
        `;
        return json({ id: rows[0].id });
      }
      return json({ error: "not found" }, 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return json({ error: message }, 500);
    } finally {
      await sql.end({ timeout: 2 });
    }
  },
};
