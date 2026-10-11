import type { ColorValue } from "react-native";

import type { IconName } from "../icon";
import { colors } from "../tokens";

export type BannerTone = "neutral" | "positive" | "warning" | "negative";

interface BannerToneSpec {
  icon: IconName;
  iconColor: ColorValue;
}

export const BANNER_TONES = {
  positive: { icon: "check", iconColor: colors.positive.text },
  warning: { icon: "warning", iconColor: colors.warning.text },
  negative: { icon: "info", iconColor: colors.negative.text },
  neutral: { icon: "info", iconColor: colors.text.secondary },
} as const satisfies Record<BannerTone, BannerToneSpec>;
