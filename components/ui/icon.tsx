import { TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { Icon as PhosphorIcon, IconProps as PhosphorIconProps } from "phosphor-react-native";
import { styled } from "nativewind";
import * as React from "react";
import { ClassValue } from "clsx";

type IconProps = PhosphorIconProps & {
  as: PhosphorIcon;
  className?: ClassValue;
};

function IconImpl({ as: IconComponent, ...props }: IconProps) {
  return <IconComponent {...props} />;
}

styled(IconImpl, {
  className: {
    target: "color",
  },
});

/**
 * A wrapper component for Phosphor icons with Nativewind `className` support via `cssInterop`.
 *
 * This component allows you to render any Phosphor icon while applying utility classes
 * using `nativewind`. It avoids the need to wrap or configure each icon individually.
 *
 * @component
 * @example
 * ```tsx
 * import { XIcon } from 'phosphor-react-native';
 * import { Icon } from '@/registry/components/ui/icon';
 *
 * <Icon as={XIcon} className="text-red-500" size={16} />
 * ```
 *
 * @param {PhosphorIcon} as - The Phosphor icon component to render.
 * @param {string} className - Utility classes to style the icon using Nativewind.
 * @param {number} size - Icon size (defaults to 14).
 * @param {...PhosphorIconProps} ...props - Additional Phosphor icon props passed to the "as" icon.
 */
function Icon({ as: IconComponent, className, size = 14, ...props }: IconProps) {
  const textClass = React.useContext(TextClassContext);
  return (
    <IconImpl
      as={IconComponent}
      className={cn("text-foreground", textClass, className)}
      size={size}
      {...props}
    />
  );
}

export { Icon };
