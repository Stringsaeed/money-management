import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

const ENTITY_SQL = /\b(FROM|INTO|UPDATE|JOIN)\s+(accounts|categories|transactions)\b/i;

function literalSql(node: ESTree.Literal): string | null {
  return typeof node.value === "string" ? node.value : null;
}

function templateSql(node: ESTree.TemplateLiteral): string {
  return node.quasis.map((quasi) => quasi.value.cooked ?? quasi.value.raw).join(" ");
}

function tableName(sql: string): string | null {
  return ENTITY_SQL.exec(sql)?.[2] ?? null;
}

export const noRawEntitySqlRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw SQL against local accounts, categories, or transactions tables outside an allowlisted SQLite role.",
    },
    messages: {
      rawEntitySql:
        'Raw SQL against `{{table}}` outside an allowlisted SQLite role. Use the ledger data source, or allowlist this file with role "authority-local".',
    },
  },
  create(context) {
    const reportSql = (node: ESTree.Node, sql: string) => {
      const table = tableName(sql);
      if (!table) return;
      context.report({
        node,
        messageId: "rawEntitySql",
        data: { table },
      });
    };

    return {
      Literal(node) {
        const sql = literalSql(node);
        if (sql) reportSql(node, sql);
      },
      TemplateLiteral(node) {
        reportSql(node, templateSql(node));
      },
    };
  },
});
