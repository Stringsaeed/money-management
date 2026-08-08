import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAppUpdate } from "@/hooks/use-app-update";

import { Card } from "./card";
import { SectionHeader } from "./section-header";

const STATUS_COPY = {
  disabled: {
    title: "Updates unavailable",
    subtitle: "Update checks are available in native release builds.",
  },
  idle: { title: "Ready to check", subtitle: "Check for the latest compatible update." },
  checking: { title: "Checking for updates…", subtitle: "This should only take a moment." },
  current: { title: "Trove is up to date", subtitle: "You have the latest compatible update." },
  available: { title: "Update available", subtitle: "Download the latest update and restart." },
  downloading: { title: "Downloading update…", subtitle: "Keep Trove open while it downloads." },
  restarting: { title: "Restarting Trove…", subtitle: "The new update is ready to launch." },
  error: { title: "Update check failed", subtitle: "Try again when you are connected." },
} as const;

export function UpdateSection() {
  const { checkForUpdate, error, installUpdate, progress, status } = useAppUpdate();
  const copy = STATUS_COPY[status];
  const isBusy = status === "checking" || status === "downloading" || status === "restarting";
  const progressLabel = `${Math.round((progress ?? 0) * 100)}%`;

  return (
    <>
      <SectionHeader title="Software Update 🔄" />
      <Card animated>
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={layoutTransition}
          className="gap-1 px-4 py-4"
        >
          <View className="flex-row items-center gap-3">
            <Text className="w-7 text-center text-xl">📦</Text>
            <View className="flex-1">
              <Text className="font-body-medium text-base text-ink">{copy.title}</Text>
              <Text className="mt-0.5 font-body-normal text-xs text-ink/40">
                {status === "downloading" ? `${copy.subtitle} ${progressLabel}` : copy.subtitle}
              </Text>
            </View>
          </View>

          {error ? (
            <Text className="mt-2 font-body-normal text-xs leading-5 text-destructive">
              {error}
            </Text>
          ) : null}

          {status !== "disabled" ? (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              layout={layoutTransition}
              className="mt-3 flex-row gap-2"
            >
              <Button
                className="flex-1"
                variant="outline"
                disabled={isBusy}
                onPress={checkForUpdate}
              >
                <Text>{status === "checking" ? "Checking…" : "Check for Update"}</Text>
              </Button>
              {status === "available" ? (
                <Button className="flex-1" onPress={installUpdate}>
                  <Text>Update Now</Text>
                </Button>
              ) : null}
            </Animated.View>
          ) : null}
        </Animated.View>
      </Card>
    </>
  );
}
