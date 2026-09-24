import { useEffect } from "react";
// oxlint-disable-next-line no-restricted-imports -- Color tweens on native props (nano icon glyph colors) need Reanimated animated props; Ease only animates styles.
import { useSharedValue, withTiming } from "react-native-reanimated";

const TINT_DURATION = 180;

/** 0 → 1 progress that eases toward `active`; drive `interpolateColor` with it. */
export function useTintProgress(active: boolean) {
  const progress = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: TINT_DURATION });
  }, [active, progress]);
  return progress;
}
