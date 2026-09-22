import { Circle, Rect, Svg } from "react-native-svg";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { tileColors } from "../tile-tokens";

export interface SeedAvatarProps {
  seed: string;
  name?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const IDENTICON_COLORS = [tileColors.olive, tileColors.pink, tileColors.ink] as const;

export function SeedAvatar({ seed, name, size = 56, style }: SeedAvatarProps) {
  const avatarSize = Number.isFinite(size) && size > 0 ? size : 56;
  const hash = hashSeed(seed);
  const cells = [];

  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const bitIndex = row * 3 + column;
      if (((hash >>> bitIndex) & 1) === 0) continue;

      const mirroredColumn = 4 - column;
      const fill = IDENTICON_COLORS[(hash + row * 5 + column * 3) % IDENTICON_COLORS.length];
      cells.push(
        <Rect
          fill={fill}
          height={14}
          key={`${row}-${column}`}
          rx={3}
          width={14}
          x={10 + column * 18}
          y={10 + row * 18}
        />,
        ...(mirroredColumn === column
          ? []
          : [
              <Rect
                fill={fill}
                height={14}
                key={`${row}-${mirroredColumn}`}
                rx={3}
                width={14}
                x={10 + mirroredColumn * 18}
                y={10 + row * 18}
              />,
            ]),
      );
    }
  }

  return (
    <View
      accessible
      accessibilityLabel={name ? `${name} avatar` : "Seed avatar"}
      accessibilityRole="image"
      style={[styles.container, { height: avatarSize, width: avatarSize }, style]}
    >
      <Svg height={avatarSize} viewBox="0 0 100 100" width={avatarSize}>
        <Circle cx={50} cy={50} fill={tileColors.white} r={49} />
        <Circle cx={50} cy={50} fill={tileColors.cream} r={47} />
        {cells}
        <Circle cx={50} cy={50} fill="none" r={47} stroke={tileColors.grout} strokeWidth={2} />
      </Svg>
    </View>
  );
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    overflow: "hidden",
  },
});
