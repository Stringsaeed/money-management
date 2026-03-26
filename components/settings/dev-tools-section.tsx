import { useState } from "react";
import { Alert, View } from "react-native";
import * as Updates from "expo-updates";
import { useQueryClient } from "@tanstack/react-query";

import { Text } from "@/components/ui/text";
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
  const updates = Updates.useUpdates();

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedDatabase(db);
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

      {updates.isUpdateAvailable && (
        <Card>
          <View className="flex-row items-center gap-3 px-4 py-3.5">
            <Text className="text-xl w-7 text-center">🔄</Text>
            <View className="flex-1">
              <Text className="font-body-medium text-base text-ink">Update Available</Text>
              <Text className="font-body-normal text-xs text-ink/40 mt-0.5">
                A new version is ready to install
              </Text>
            </View>
          </View>
          <Divider />
          <SettingsRow
            emoji="⬇️"
            label="Download & Restart"
            onPress={() => Updates.reloadAsync()}
          />
        </Card>
      )}

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
