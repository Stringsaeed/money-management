import { StyleSheet, View } from "react-native";

import { ListGroup, ListRow, Slider, space, Switch } from "@/ui/trove";

import { playCue } from "./sound-cues";
import { updateSoundPreferences } from "./sound-store";
import { useSoundPreferences } from "./use-sound-preferences";
import { useVolumePreview } from "./use-volume-preview";

const VOLUME_STEP = 0.05;

export function SoundSettings() {
  const { enabled, volume } = useSoundPreferences();
  const previewVolume = useVolumePreview();

  const toggleSound = (next: boolean) => {
    updateSoundPreferences({ enabled: next });
    if (next) playCue("toggle");
  };

  const changeVolume = (next: number) => {
    updateSoundPreferences({ volume: next });
    previewVolume();
  };

  return (
    <View style={styles.root}>
      <ListGroup dividerInset={0}>
        <ListRow
          subtitle="Soft cues when you save, delete, or type an amount."
          title="Sounds"
          trailing={
            <Switch accessibilityLabel="Sounds" value={enabled} onValueChange={toggleSound} />
          }
        />
      </ListGroup>
      <Slider
        accessibilityLabel="Sound effects volume"
        adornment="volume"
        disabled={!enabled}
        label="Volume"
        onValueChange={changeVolume}
        step={VOLUME_STEP}
        value={volume}
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { gap: space[3] } });
