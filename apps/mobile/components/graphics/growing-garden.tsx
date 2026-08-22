import { useEffect } from "react";
import { View, type ViewProps } from "react-native";
import Animated, {
  type AnimatedProps,
  cancelAnimation,
  createAnimatedComponent,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

import { useGraphicPalette } from "./palette";

const AnimatedPath = createAnimatedComponent(Path);

/** The illustration is authored at this size and scaled uniformly from there. */
const BASE_WIDTH = 200;
const BASE_HEIGHT = 148;

/** Slightly under the real path length so the very first pixel appears at once. */
const STEM_LENGTH = 72;

/**
 * Bare soil (0) through full bloom (6). The flow enters at stage 2 so the
 * welcome screen already shows a real plant rather than an empty plot, then
 * takes one notch per step up to the coin.
 */
export const GARDEN_STAGES = 6;

const GROWTH_SPRING = { damping: 16, mass: 1, stiffness: 90 } as const;

/**
 * Each growth element wakes up over its own slice of the overall growth value,
 * so the plant unfolds from the ground up rather than all at once.
 */
const SPROUT_LEFT_WINDOW = [0.1, 0.34] as const;
const LEAF_LOW_WINDOW = [0.18, 0.4] as const;
const SPROUT_RIGHT_WINDOW = [0.36, 0.58] as const;
const LEAF_MID_WINDOW = [0.44, 0.66] as const;
const LEAF_HIGH_WINDOW = [0.62, 0.84] as const;
const COIN_WINDOW = [0.84, 1] as const;

interface GrowingGardenProps {
  /** 0 = bare soil, {@link GARDEN_STAGES} = fully bloomed. Fractions are fine. */
  stage: number;
  /**
   * Where growth starts from on mount. Onboarding phases render their own
   * instance, so each one picks up at the stage the previous phase left off
   * and the plant never appears to reset.
   */
  initialStage?: number;
  /** Renders a slow halo pulse behind the coin — for the celebration beat. */
  bloom?: boolean;
  width?: number;
}

/**
 * The signature onboarding illustration: a seed that grows into a coin-bearing
 * plant, one stage per step. Growth is spring-driven so leaves overshoot and
 * settle the way a real sprout would unfurl.
 *
 * Structure note: every animated part is a full-size overlay `Animated.View`
 * with its own `<Svg>` and a `transformOrigin` pinned to where that part joins
 * the plant. That keeps every transform on the reliable RN view path (rather
 * than animating SVG group transforms) while still letting each leaf pivot
 * from its own stem joint.
 */
export function GrowingGarden({
  stage,
  initialStage = 0,
  bloom = false,
  width = BASE_WIDTH,
}: GrowingGardenProps) {
  const { ink, sage, terracotta, surfaceDim } = useGraphicPalette();
  const reducedMotion = useReducedMotion();

  const scale = width / BASE_WIDTH;
  const height = BASE_HEIGHT * scale;

  const growth = useSharedValue(toGrowth(initialStage));
  const halo = useSharedValue(0);

  const target = toGrowth(stage);

  useEffect(() => {
    growth.value = reducedMotion
      ? withTiming(target, { duration: 200 })
      : withSpring(target, GROWTH_SPRING);
  }, [growth, reducedMotion, target]);

  useEffect(() => {
    if (!bloom || reducedMotion) {
      halo.value = withTiming(0, { duration: 200 });
      return;
    }

    halo.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );

    return () => cancelAnimation(halo);
  }, [bloom, halo, reducedMotion]);

  const stemProgress = useDerivedValue(() => clamp01(growth.value / 0.75));

  const stemProps = useAnimatedProps(() => ({
    strokeDashoffset: STEM_LENGTH * (1 - stemProgress.value),
    opacity: clamp01(stemProgress.value * 6),
  }));

  const seedStyle = useAnimatedStyle(() => ({
    opacity: 1 - clamp01(growth.value / 0.3),
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: window01(growth.value, COIN_WINDOW) * 0.45 * (1 - halo.value),
    transform: [{ scale: 0.7 + halo.value * 0.9 }],
  }));

  return (
    <View style={{ width, height }}>
      {/* Ground, soil mound and pebbles — the one part that never changes. */}
      <Svg width={width} height={height} viewBox="0 0 200 148" fill="none">
        <Path
          d="M78 126 C84 115 116 115 122 126 Z"
          fill={surfaceDim}
          fillOpacity={0.9}
          stroke="none"
        />
        <Path
          d="M40 126 C70 120 130 120 160 126"
          stroke={ink}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Circle cx={52} cy={131} r={1.6} fill={ink} opacity={0.35} />
        <Circle cx={120} cy={132} r={1.3} fill={ink} opacity={0.3} />
        <Circle cx={148} cy={130} r={1.6} fill={ink} opacity={0.35} />
      </Svg>

      {/* Seed — dissolves as the stem takes over. */}
      <GardenLayer style={seedStyle} width={width} height={height}>
        <Ellipse
          cx={100}
          cy={119}
          rx={5.5}
          ry={4.5}
          fill={terracotta}
          fillOpacity={0.45}
          stroke={terracotta}
          strokeWidth={2}
          transform="rotate(-20 100 119)"
        />
      </GardenLayer>

      {/* Main stem — drawn on with a dash offset. */}
      <View style={overlay(width, height)} pointerEvents="none">
        <Svg width={width} height={height} viewBox="0 0 200 148" fill="none">
          <AnimatedPath
            animatedProps={stemProps}
            d="M100 122 C100 106 98 92 100 74 C101 64 100 58 100 52"
            stroke={sage}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={`${STEM_LENGTH} ${STEM_LENGTH}`}
          />
        </Svg>
      </View>

      <GrowthPart
        growth={growth}
        window={SPROUT_LEFT_WINDOW}
        anchor={[62, 126]}
        scale={scale}
        width={width}
        height={height}
      >
        <Path
          d="M62 126 C62 121 62 117 62 112"
          stroke={sage}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Path
          d="M62 117 C56 117 51 114 48 107 C55 107 60 112 62 117 Z"
          fill={sage}
          fillOpacity={0.35}
          stroke={sage}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      </GrowthPart>

      <GrowthPart
        growth={growth}
        window={LEAF_LOW_WINDOW}
        anchor={[100, 105]}
        scale={scale}
        width={width}
        height={height}
      >
        <Path
          d="M100 106 C88 106 76 100 68 88 C84 88 96 96 100 106 Z"
          fill={sage}
          fillOpacity={0.35}
          stroke={sage}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </GrowthPart>

      <GrowthPart
        growth={growth}
        window={SPROUT_RIGHT_WINDOW}
        anchor={[140, 126]}
        scale={scale}
        width={width}
        height={height}
      >
        <Path
          d="M140 126 C140 121 140 117 140 113"
          stroke={sage}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Path
          d="M140 118 C146 118 151 115 154 108 C147 108 142 113 140 118 Z"
          fill={sage}
          fillOpacity={0.35}
          stroke={sage}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      </GrowthPart>

      <GrowthPart
        growth={growth}
        window={LEAF_MID_WINDOW}
        anchor={[100, 91]}
        scale={scale}
        width={width}
        height={height}
      >
        <Path
          d="M100 92 C112 92 124 86 132 74 C116 74 104 82 100 92 Z"
          fill={sage}
          fillOpacity={0.35}
          stroke={sage}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </GrowthPart>

      <GrowthPart
        growth={growth}
        window={LEAF_HIGH_WINDOW}
        anchor={[100, 79]}
        scale={scale}
        width={width}
        height={height}
      >
        <Path
          d="M100 80 C90 80 80 75 73 65 C86 65 96 71 100 80 Z"
          fill={sage}
          fillOpacity={0.35}
          stroke={sage}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </GrowthPart>

      {/* Halo sits under the coin so the pulse reads as light, not an outline. */}
      <GardenLayer
        style={haloStyle}
        width={width}
        height={height}
        origin={[100 * scale, 44 * scale, 0]}
      >
        <Circle cx={100} cy={44} r={22} stroke={sage} strokeWidth={2} fill="none" />
      </GardenLayer>

      <GrowthPart
        growth={growth}
        window={COIN_WINDOW}
        anchor={[100, 56]}
        scale={scale}
        width={width}
        height={height}
      >
        <Circle
          cx={100}
          cy={44}
          r={16}
          fill={surfaceDim}
          fillOpacity={0.65}
          stroke={ink}
          strokeWidth={2.5}
        />
        {/* Two concentric rings, matching the coin in coin-plant.tsx. A centre
            mark reads as a prohibition sign at this size. */}
        <Circle cx={100} cy={44} r={9.5} stroke={sage} strokeWidth={1.8} fill="none" />
      </GrowthPart>
    </View>
  );
}

interface GrowthPartProps {
  anchor: readonly [number, number];
  children: React.ReactNode;
  growth: SharedValue<number>;
  height: number;
  scale: number;
  width: number;
  window: readonly [number, number];
}

/** One growth element: scales and fades in over its slice of the growth value. */
function GrowthPart({
  anchor,
  children,
  growth,
  height,
  scale,
  width,
  window: growthWindow,
}: GrowthPartProps) {
  const style = useAnimatedStyle(() => {
    const progress = window01(growth.value, growthWindow);
    return {
      opacity: clamp01(progress * 1.6),
      transform: [{ scale: progress }],
    };
  });

  return (
    <GardenLayer
      style={style}
      width={width}
      height={height}
      origin={[anchor[0] * scale, anchor[1] * scale, 0]}
    >
      {children}
    </GardenLayer>
  );
}

interface GardenLayerProps {
  children: React.ReactNode;
  height: number;
  /** Pivot in points, relative to the layer's top-left. React Native requires
   * all three axes, so the z origin is always 0. */
  origin?: [number, number, number];
  style: AnimatedProps<ViewProps>["style"];
  width: number;
}

/** A full-size transparent overlay holding a single part of the illustration. */
function GardenLayer({ children, height, origin, style, width }: GardenLayerProps) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[overlay(width, height), origin ? { transformOrigin: origin } : null, style]}
    >
      <Svg width={width} height={height} viewBox="0 0 200 148" fill="none">
        {children}
      </Svg>
    </Animated.View>
  );
}

function overlay(width: number, height: number) {
  return { position: "absolute", top: 0, left: 0, width, height } as const;
}

/** Maps a stage number onto the 0…1 growth value the layers interpolate over. */
function toGrowth(stage: number) {
  return Math.min(Math.max(stage, 0), GARDEN_STAGES) / GARDEN_STAGES;
}

function clamp01(value: number) {
  "worklet";
  return Math.min(Math.max(value, 0), 1);
}

/** Normalises `value` to 0…1 across `[start, end]`, clamped at both ends. */
function window01(value: number, [start, end]: readonly [number, number]) {
  "worklet";
  return Math.min(Math.max((value - start) / (end - start), 0), 1);
}
