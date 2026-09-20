import {
  NumberFlow as NumberFlowPrimitive,
  type NumberFlowProps as NumberFlowPrimitiveProps,
} from "number-flow-react-native";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface NumberFlowProps extends NumberFlowPrimitiveProps {
  /**
   * @deprecated Use `style` prop with design tokens instead.
   * This prop exists for backward compatibility with NativeWind consumers.
   * NativeWind transforms className → style at compile time.
   */
  className?: string;
  /**
   * @deprecated Use `containerStyle` prop with design tokens instead.
   * This prop exists for backward compatibility with NativeWind consumers.
   * NativeWind transforms containerClassName → containerStyle at compile time.
   */
  containerClassName?: string;
}

// -----------------------------------------------------------------------------
// NumberFlow Component
// -----------------------------------------------------------------------------

/**
 * Animated number component that smoothly transitions between values.
 *
 * Use the `style` prop for text styling and `containerStyle` for the outer container.
 *
 * @example
 * ```tsx
 * import { NumberFlow } from "@/components/ui/number-flow";
 * import { typography, colors } from "@/lib/design-tokens";
 *
 * <NumberFlow
 *   value={1234.56}
 *   style={{
 *     fontSize: typography.text5xl,
 *     fontFamily: typography.fontBodyMedium,
 *     color: colors.ink,
 *   }}
 *   prefix="$"
 * />
 * ```
 */
function NumberFlow({
  className: _className,
  containerClassName: _containerClassName,
  ...props
}: NumberFlowProps) {
  return <NumberFlowPrimitive {...props} />;
}

export { NumberFlow };
export type { NumberFlowProps };
