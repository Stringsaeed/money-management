import { useCallback, useEffect, type ComponentType } from "react";
import { Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ChartPieIcon, CreditCardIcon, GearIcon, ListIcon } from "phosphor-react-native";
import type { SharedValue } from "react-native-reanimated";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

// ─── Theme — dark (matches BubbleBar's built-in .dark theme) ─────────────────
//
//  barBackground  = Color(red:0.1, green:0.1, blue:0.15)  → #1A1A26
//  selected       = Color.blue (dark-mode system blue)     → #0A84FF
//  unselected     = Color(.secondarySystemFill)            → rgba(120,120,128,0.45)
//  bubbleBackground = selected.opacity(0.15)
//  bubbleStroke     = selected.opacity(0.40)
//  barStroke        = selected.opacity(0.20)

const ACCENT = "#0A84FF";
const BUBBLE_BG = "rgba(10, 132, 255, 0.15)";
const BUBBLE_BORDER = "rgba(10, 132, 255, 0.40)";
const ACTIVE_COLOR = ACCENT;
const INACTIVE_COLOR = "rgba(120, 120, 128, 0.45)";
const BAR_BG = "#1A1A26";
const BAR_BORDER = "rgba(10, 132, 255, 0.20)";

// ─── Sizing ───────────────────────────────────────────────────────────────────

const BAR_HEIGHT = 54;
const INNER_PADDING = 6;
const BUBBLE_HEIGHT = BAR_HEIGHT - INNER_PADDING * 2;
const ICON_SIZE = 24;
const LABEL_SIZE = 12;
/** Margin above the safe-area bottom edge */
const BOTTOM_MARGIN = 12;
const HORIZONTAL_MARGIN = 20;

// Matches SwiftUI .spring(response: 0.3, dampingFraction: 0.7)
// ω₀ = 2π/0.3 ≈ 20.94 → stiffness = ω₀² ≈ 439, damping = 0.7 × 2√(k·m) ≈ 29
const SPRING = { stiffness: 439, damping: 29, mass: 1 } as const;

// ─── Tab config ───────────────────────────────────────────────────────────────

type PhosphorIcon = ComponentType<{ size: number; color: string; weight: string }>;

const TABS: { route: string; label: string; Icon: PhosphorIcon }[] = [
  { route: "index", label: "Home", Icon: ChartPieIcon as PhosphorIcon },
  { route: "transactions", label: "Spend", Icon: ListIcon as PhosphorIcon },
  { route: "accounts", label: "Cards", Icon: CreditCardIcon as PhosphorIcon },
  { route: "settings", label: "Settings", Icon: GearIcon as PhosphorIcon },
];

// ─── TabItem ──────────────────────────────────────────────────────────────────

type TabItemProps = {
  tab: (typeof TABS)[number];
  index: number;
  activeIndex: SharedValue<number>;
  tabWidth: number;
  onPress: () => void;
};

function TabItem({ tab, index, activeIndex, tabWidth, onPress }: TabItemProps) {
  const { Icon } = tab;

  // 0 → 1 progress for this tab, animated on the UI thread
  const progress = useDerivedValue(() => withSpring(activeIndex.value === index ? 1 : 0, SPRING));

  // Subtle lift: whole row floats up 2pt when active
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [0, -2], Extrapolation.CLAMP),
      },
    ],
  }));

  // Icon scale: grows 12 % on activation; spring overshoot = natural bounce
  const iconScaleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(progress.value, [0, 1], [1, 1.12], Extrapolation.CLAMP),
      },
    ],
  }));

  // Crossfade: fill (active) vs regular (inactive)
  const activeIconStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const inactiveIconStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));

  // Label slides in beside the icon when active, hidden when inactive.
  // maxWidth collapses the space so inactive tabs don't reserve text room.
  const labelContainerStyle = useAnimatedStyle(() => ({
    maxWidth: interpolate(progress.value, [0, 1], [0, 72], Extrapolation.CLAMP),
    opacity: interpolate(progress.value, [0.2, 0.8], [0, 1], Extrapolation.CLAMP),
    marginLeft: interpolate(progress.value, [0, 1], [0, 6], Extrapolation.CLAMP),
  }));

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: tabWidth,
        height: BAR_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Row: icon on the left, label slides in on the right */}
      <Animated.View style={[{ flexDirection: "row", alignItems: "center" }, containerStyle]}>
        {/* Icon stack: inactive below, active fill on top */}
        <Animated.View style={iconScaleStyle}>
          <View style={{ width: ICON_SIZE, height: ICON_SIZE }}>
            <Animated.View style={[{ position: "absolute" }, inactiveIconStyle]}>
              <Icon size={ICON_SIZE} color={INACTIVE_COLOR} weight="regular" />
            </Animated.View>
            <Animated.View style={[{ position: "absolute" }, activeIconStyle]}>
              <Icon size={ICON_SIZE} color={ACTIVE_COLOR} weight="fill" />
            </Animated.View>
          </View>
        </Animated.View>

        {/* Label: clipped container collapses to zero width when inactive */}
        <Animated.View style={[{ overflow: "hidden" }, labelContainerStyle]}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: LABEL_SIZE,
              fontWeight: "600",
              color: ACTIVE_COLOR,
              letterSpacing: 0.3,
            }}
          >
            {tab.label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── BubbleTabBar ─────────────────────────────────────────────────────────────

export function BubbleTabBar({ state, navigation }: BottomTabBarProps) {
  const { bottom: safeBottom } = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const barWidth = screenWidth - HORIZONTAL_MARGIN * 2;
  const tabWidth = barWidth / TABS.length;

  const activeIndex = useSharedValue(state.index);

  // Stay in sync for back navigation, deep-links, and gesture dismissals
  useEffect(() => {
    activeIndex.value = state.index;
  }, [state.index, activeIndex]);

  // Bubble translates horizontally; INNER_PADDING offsets from the bar's left edge
  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(activeIndex.value * tabWidth + INNER_PADDING, SPRING),
      },
    ],
  }));

  const handlePress = useCallback(
    (index: number, route: string) => {
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      // Set immediately so the bubble animates before navigation resolves
      activeIndex.value = index;
      navigation.navigate(route);
    },
    [activeIndex, navigation],
  );
  /*
   * Visual pill bar, absolutely positioned inside the wrapper so it sits:
   *   BOTTOM_MARGIN above the safe-area bottom edge
   *
   * bottom = Math.max(safeBottom, 8) + BOTTOM_MARGIN ensures the bar never
   * clips into the home indicator on notched / dynamic-island devices.
   */
  return (
    <View
      style={{
        position: "absolute",
        bottom: Math.max(safeBottom, 8) + BOTTOM_MARGIN,
        left: HORIZONTAL_MARGIN,
        right: HORIZONTAL_MARGIN,
        height: BAR_HEIGHT,
        borderRadius: 28,
        backgroundColor: BAR_BG,
        borderWidth: 0.5,
        borderColor: BAR_BORDER,
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.55)",
      }}
    >
      {/* Floating bubble — slides between tab positions */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: INNER_PADDING,
            width: tabWidth - INNER_PADDING * 2,
            height: BUBBLE_HEIGHT,
            borderRadius: 22,
            backgroundColor: BUBBLE_BG,
            borderWidth: 0.5,
            borderColor: BUBBLE_BORDER,
          },
          bubbleStyle,
        ]}
      />

      {/* Tab items */}
      <View style={{ flex: 1, flexDirection: "row" }}>
        {TABS.map((tab, index) => (
          <TabItem
            key={tab.route}
            tab={tab}
            index={index}
            activeIndex={activeIndex}
            tabWidth={tabWidth}
            onPress={() => handlePress(index, tab.route)}
          />
        ))}
      </View>
    </View>
  );
}
