import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { Platform } from "react-native";

/**
 * iOS 26+ draws the bar in Liquid Glass. Older iOS keeps the blurred material and Android its
 * solid surface. The API check guards early iOS 26 betas that lack it.
 */
export const TAB_BAR_GLASS =
  Platform.OS === "ios" && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
