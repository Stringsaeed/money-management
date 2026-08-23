import type { z } from "zod";

import type { ValidationIssue } from "@trove/protocol";

/** Maps a zod failure onto the protocol's validation-issue shape. */
export function issuesFromZod(error: z.ZodError): readonly ValidationIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join(".") || "(envelope)",
    message: issue.message,
  }));
}
