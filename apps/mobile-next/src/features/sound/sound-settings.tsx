import { StyleSheet, View } from "react-native";

import { Slider, Surface, Switch, Text } from "@/ui";
import { colors, spacing } from "@/ui/design-tokens";

import { playCue } from "./sound-cues";
import { updateSoundPreferences } from "./sound-store";
import { useSoundPreferences } from "./use-sound-preferences";
import { useVolumePreview } from "./use-volume-preview";

const VOLUME_STEP = 0.05;

export function SoundSettings() {
  const { enabled, volume } = useSoundPreferences();
  const previewVolume = useVolumePreview();
  const volumePercent = Math.round(volume * 100);

  const toggleSound = (next: boolean) => {
    updateSoundPreferences({ enabled: next });
    if (next) playCue("toggle");
  };

  const changeVolume = (next: number) => {
    updateSoundPreferences({ volume: next });
    previewVolume();
  };

  return (
    <Surface variant="raised" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text variant="title">Sounds</Text>
          <Text variant="caption">Soft cues when you save, delete, or type an amount.</Text>
        </View>
        <Switch accessibilityLabel="Sounds" value={enabled} onValueChange={toggleSound} />
      </View>
      <View style={[styles.volume, !enabled && styles.disabled]}>
        <View style={styles.row}>
          <Text variant="label">Volume</Text>
          <Text variant="label" style={styles.value}>
            {volumePercent}%
          </Text>
        </View>
        <Slider
          value={volume}
          step={VOLUME_STEP}
          disabled={!enabled}
          onValueChange={changeVolume}
        />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[4] },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
  },
  copy: { flex: 1, gap: spacing[1] },
  volume: { gap: spacing[2] },
  value: { color: colors.foreground, fontVariant: ["tabular-nums"] },
  disabled: { opacity: 0.48 },
});
