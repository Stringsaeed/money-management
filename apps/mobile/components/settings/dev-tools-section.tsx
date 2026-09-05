import { useState } from "react";
import { Alert } from "react-native";
import * as Updates from "expo-updates";
import { useQueryClient } from "@tanstack/react-query";

import { useDatabase } from "@/db/client";
import { seedDatabase } from "@/db/seed";
import { useLedgerSourceSelection } from "@/modules/ledger-data-source/provider";
import { cohereLedgerCache } from "@/modules/ledger-cache";

import { Card } from "./card";
import { Divider } from "./divider";
import { SectionHeader } from "./section-header";
import { SettingsRow } from "./settings-row";

const SYNCED_SEED_REASON = "Seed is unavailable while this device is synced to a household.";

export function DevToolsSection() {
  const db = useDatabase();
  const qc = useQueryClient();
  const selection = useLedgerSourceSelection();
  const [seeding, setSeeding] = useState(false);
  const seedUnavailable = selection.kind === "synced";

  async function handleSeed() {
    if (seedUnavailable) return;
    setSeeding(true);
    try {
      await seedDatabase(db, { force: true });
      await cohereLedgerCache(qc, { kind: "category.batch" });
      Alert.alert("Done", "Seed data has been inserted.");
    } catch {
      Alert.alert("Error", "Failed to seed data — data may already exist.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <>
      <SectionHeader title="Dev Tools 🧑‍💻" />

      <Card>
        <SettingsRow
          emoji="🌱"
          label={seeding ? "Seeding…" : "Run Seed Data"}
          subtitle={
            seedUnavailable
              ? SYNCED_SEED_REASON
              : "Insert demo accounts, categories, and transactions"
          }
          onPress={seedUnavailable ? undefined : handleSeed}
          noChevron
        />
        {Updates.channel ? (
          <>
            <Divider />
            <SettingsRow emoji="📡" label="Build Channel" rightLabel={Updates.channel} noChevron />
          </>
        ) : null}
      </Card>
    </>
  );
}
