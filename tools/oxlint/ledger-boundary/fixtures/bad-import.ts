import { accounts, transactions } from "@/db/schema";
import { useDatabase } from "@/db/client";

export const leak = { accounts, transactions, useDatabase };
