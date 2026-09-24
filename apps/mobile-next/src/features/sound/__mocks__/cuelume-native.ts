/** Records played sound names so tests can assert on audible feedback without native audio. */
export const playedSounds: string[] = [];

export const sounds = [] as const;
export const play = (name: string) => {
  playedSounds.push(name);
};
export const setEnabled = (_enabled: boolean) => undefined;
export const setVolume = (_volume: number) => undefined;
