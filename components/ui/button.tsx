import { TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Platform, Pressable, useColorScheme } from "react-native";

// NOTE: group-* is not supported yet by Uniwind

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

type GradientState = {
  idle: readonly [string, string];
  interactive: readonly [string, string];
};

// Kumo defines these colors with OKLCH color-mix(). React Native does not parse OKLCH,
// so the primary stops below are their clipped sRGB equivalents.
const BUTTON_GRADIENTS: Partial<
  Record<ButtonVariant, { light: GradientState; dark: GradientState }>
> = {
  default: {
    light: {
      idle: ["#3c86ff", "#056dff"],
      interactive: ["#619eff", "#056dff"],
    },
    dark: {
      idle: ["#2c77f0", "#005aeb"],
      interactive: ["#5491f6", "#005aeb"],
    },
  },
  destructive: {
    light: {
      idle: ["#ff5b57", "#fb2c36"],
      interactive: ["#ff7d75", "#fb2c36"],
    },
    dark: {
      idle: ["#f0463e", "#e7000b"],
      interactive: ["#f86e62", "#e7000b"],
    },
  },
  secondary: {
    light: {
      idle: ["#8db99e", "#6e9c80"],
      interactive: ["#8db99e", "#6e9c80"],
    },
    dark: {
      idle: ["#a3c3b0", "#6e9c80"],
      interactive: ["#a3c3b0", "#6e9c80"],
    },
  },
};

const TOP_HIGHLIGHT = "rgba(255, 255, 255, 0.16)";
const HIGHLIGHT_FADE = "rgba(255, 255, 255, 0)";

const buttonVariants = cva(
  cn(
    "group shrink-0 flex-row items-center justify-center overflow-hidden border-0 shadow-xs select-none",
    Platform.select({
      web: "cursor-pointer whitespace-nowrap outline-none disabled:pointer-events-none disabled:cursor-not-allowed [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    }),
  ),
  {
    variants: {
      variant: {
        default: cn(
          "relative bg-[#619eff] text-white ring ring-[#045ede] inset-shadow-[0_1px_0_0_#619eff] disabled:opacity-50 dark:bg-[#5491f6] dark:ring-[#004dcc] dark:inset-shadow-[0_1px_0_0_#5491f6]",
          Platform.select({
            web: "focus:ring-[#045ede] focus-visible:ring-2 focus-visible:ring-[#045ede] active:ring-[#045ede] dark:focus:ring-[#004dcc] dark:focus-visible:ring-[#004dcc] dark:active:ring-[#004dcc]",
          }),
        ),
        destructive: cn(
          "relative bg-[#ff7d75] text-white ring ring-[#da252e] inset-shadow-[0_1px_0_0_#ff7d75] disabled:opacity-50 dark:bg-[#f86e62] dark:ring-[#c90008] dark:inset-shadow-[0_1px_0_0_#f86e62]",
          Platform.select({
            web: "focus:ring-[#da252e] focus-visible:ring-2 focus-visible:ring-[#da252e] active:ring-[#da252e] dark:focus:ring-[#c90008] dark:focus-visible:ring-[#c90008] dark:active:ring-[#c90008]",
          }),
        ),
        secondary: cn(
          "border border-white/25 shadow-sm shadow-black/5 active:opacity-90",
          Platform.select({ web: "hover:opacity-90" }),
        ),
        outline: cn(
          "border-border bg-background active:bg-accent dark:bg-input/30 dark:border-input dark:active:bg-input/50 border shadow-sm shadow-black/5",
          Platform.select({
            web: "hover:bg-accent dark:hover:bg-input/50",
          }),
        ),
        ghost: cn(
          "active:bg-accent dark:active:bg-accent/50",
          Platform.select({ web: "hover:bg-accent dark:hover:bg-accent/50" }),
        ),
        link: "",
      },
      size: {
        default: "h-9 gap-1.5 rounded-lg px-3",
        sm: "h-6.5 gap-1 rounded-md px-2",
        lg: "h-10 gap-2 rounded-lg px-4",
        xl: "h-14 gap-2 rounded-lg px-6",
        fab: "size-14 rounded-full",
        icon: "size-9 rounded-lg p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonTextVariants = cva(
  cn(
    "text-foreground text-sm font-medium leading-[21px] tracking-normal",
    Platform.select({ web: "pointer-events-none transition-colors" }),
  ),
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        destructive: "text-white",
        outline: cn(
          "group-active:text-accent-foreground",
          Platform.select({ web: "group-hover:text-accent-foreground" }),
        ),
        secondary: "text-secondary-foreground",
        ghost: "group-active:text-accent-foreground",
        link: cn(
          "text-primary group-active:underline",
          Platform.select({ web: "underline-offset-4 hover:underline group-hover:underline" }),
        ),
      },
      size: {
        default: "",
        sm: "text-xs",
        lg: "",
        xl: "text-[17px]",
        fab: "",
        icon: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

function Button({
  className,
  variant = "default",
  size,
  children,
  onHoverIn,
  onHoverOut,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const [isHovered, setIsHovered] = useState(false);
  const gradient = variant ? BUTTON_GRADIENTS[variant] : undefined;
  const gradientState = gradient?.[colorScheme === "dark" ? "dark" : "light"];

  const handleHoverIn: ButtonProps["onHoverIn"] = (event) => {
    setIsHovered(true);
    onHoverIn?.(event);
  };

  const handleHoverOut: ButtonProps["onHoverOut"] = (event) => {
    setIsHovered(false);
    onHoverOut?.(event);
  };

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && "opacity-50", buttonVariants({ variant, size }), className)}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        role="button"
        {...props}
      >
        {(state) => (
          <>
            {gradientState ? (
              <>
                <LinearGradient
                  colors={
                    isHovered || state.pressed ? gradientState.interactive : gradientState.idle
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
                {variant !== "default" ? (
                  <LinearGradient
                    colors={[TOP_HIGHLIGHT, HIGHLIGHT_FADE]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "50%",
                    }}
                  />
                ) : null}
              </>
            ) : null}
            {typeof children === "function" ? children(state) : children}
          </>
        )}
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { Button };
