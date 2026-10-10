export interface UserColorSwatch {
  readonly name: string;
  readonly hex: string;
}

/**
 * The nine colours a person can give their own category or account. These are data, not
 * design tokens: the chosen hex is stored with the record, so it is the raw-colour bridge
 * described in `./utils.ts` rather than a theme entry. Names are what VoiceOver reads.
 */
export const USER_COLOR_SWATCHES = [
  { name: "Blue", hex: "#3E4CF0" },
  { name: "Teal", hex: "#14A3A3" },
  { name: "Green", hex: "#2E9E5B" },
  { name: "Violet", hex: "#7A5AF0" },
  { name: "Magenta", hex: "#D8579A" },
  { name: "Orange", hex: "#EB6834" },
  { name: "Amber", hex: "#CC8B00" },
  { name: "Olive", hex: "#6E8B1E" },
  { name: "Stone", hex: "#8C887D" },
] as const satisfies readonly UserColorSwatch[];
