import { StyleSheet, View } from "react-native";

import { SettingsRow, SettingsSection, Slider, space, Switch } from "@/ui/trove";

import { playCue } from "./sound-cues";
import { updateSoundPreferences } from "./sound-store";
import { useSoundPreferences } from "./use-sound-preferences";
import { useVolumePreview } from "./use-volume-preview";

const VOLUME_STEP = 0.05;

/** Settings section: sound cues on or off, and their volume. */
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
      <SettingsSection footer="Soft cues when you save, delete, or type an amount." title="Sound">
        <SettingsRow
          icon="volume"
          title="Sounds"
          trailing={
            <Switch accessibilityLabel="Sounds" value={enabled} onValueChange={toggleSound} />
          }
        />
      </SettingsSection>
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
