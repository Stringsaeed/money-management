import { useState } from "react";
import { Alert } from "react-native";
import * as Updates from "expo-updates";
import { useQueryClient } from "@tanstack/react-query";

import { useDatabase } from "@/db/client";
import { seedDatabase } from "@/db/seed";

import { Card } from "./card";
import { Divider } from "./divider";
import { SectionHeader } from "./section-header";
import { SettingsRow } from "./settings-row";

export function DevToolsSection() {
  const db = useDatabase();
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedDatabase(db, { force: true });
      qc.invalidateQueries();
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
          subtitle="Insert demo accounts, categories, and transactions"
          onPress={handleSeed}
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
