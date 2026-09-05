import { accounts } from "@/db/schema";
import { useDatabase } from "@/db/client";

export const allowed = { accounts, useDatabase };
