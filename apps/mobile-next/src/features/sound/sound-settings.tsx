import { StyleSheet, View } from "react-native";

import { Slider } from "@/ui";
import { layout, ListGroup, ListRow, space, Switch, Text } from "@/ui/trove";

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
    <ListGroup dividerInset={0}>
      <ListRow
        subtitle="Soft cues when you save, delete, or type an amount."
        title="Sounds"
        trailing={
          <Switch accessibilityLabel="Sounds" value={enabled} onValueChange={toggleSound} />
        }
      />
      <View style={[styles.volume, !enabled && styles.disabled]}>
        <View style={styles.volumeRow}>
          <Text tone="secondary" variant="labelSm">
            Volume
          </Text>
          <Text variant="amountSm">{volumePercent}%</Text>
        </View>
        {/* Gap: Trove has no slider; the legacy native slider stays. */}
        <Slider
          value={volume}
          step={VOLUME_STEP}
          disabled={!enabled}
          onValueChange={changeVolume}
        />
      </View>
    </ListGroup>
  );
}

const styles = StyleSheet.create({
  volume: { gap: space[2], padding: layout.cardPadding },
  volumeRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  disabled: { opacity: 0.48 },
});
