import { play, type SoundName } from "cuelume-native";

/** App-level meaning of a sound; keeps call sites independent of the sound palette. */
export type SoundCue = "key" | "success" | "remove" | "error" | "toggle" | "preview";

const CUE_SOUNDS = {
  key: "tick",
  success: "success",
  remove: "droplet",
  error: "error",
  toggle: "toggle",
  preview: "chime",
} as const satisfies Record<SoundCue, SoundName>;

/** Plays a cue under the user's sound preferences; a silent no-op when sound is off. */
export const playCue = (cue: SoundCue) => play(CUE_SOUNDS[cue]);
