import type { ColorValue } from "react-native";

import type { IconName } from "../icon";
import { colors } from "../tokens";

export type BannerTone = "warning" | "negative" | "neutral";

interface BannerToneSpec {
  icon: IconName;
  iconColor: ColorValue;
}

export const BANNER_TONES = {
  warning: { icon: "warning", iconColor: colors.warning.text },
  negative: { icon: "info", iconColor: colors.negative.text },
  neutral: { icon: "info", iconColor: colors.text.secondary },
} as const satisfies Record<BannerTone, BannerToneSpec>;
