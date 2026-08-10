import { TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, useColorScheme } from "react-native";

// NOTE: group-* is not supported yet by Uniwind

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

// The default stops are sRGB equivalents of the supplied OKLCH emphasis-button tokens.
const BUTTON_GRADIENTS: Partial<
  Record<ButtonVariant, { light: readonly [string, string]; dark: readonly [string, string] }>
> = {
  default: {
    light: ["#5491f6", "#005aeb"],
    dark: ["#5491f6", "#005aeb"],
  },
  destructive: {
    light: ["#d97a62", "#c4452f"],
    dark: ["#e9907a", "#c4452f"],
  },
  secondary: {
    light: ["#8db99e", "#6e9c80"],
    dark: ["#a3c3b0", "#6e9c80"],
  },
};

const TOP_HIGHLIGHT = "rgba(255, 255, 255, 0.16)";
const HIGHLIGHT_FADE = "rgba(255, 255, 255, 0)";

const buttonVariants = cva(
  cn(
    "group shrink-0 flex-row items-center justify-center gap-2 overflow-hidden rounded-lg shadow-none",
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    }),
  ),
  {
    variants: {
      variant: {
        default: cn(
          "inset-shadow-[0_1px_0_0_#5491f6] active:opacity-90",
          Platform.select({ web: "hover:opacity-90" }),
        ),
        destructive: cn(
          "border border-white/25 shadow-sm shadow-black/5 active:opacity-90",
          Platform.select({
            web: "hover:opacity-90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
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
        default: cn("h-9 px-4", Platform.select({ web: "has-[>svg]:px-3" })),
        sm: cn("h-9 gap-1.5 px-3 sm:h-8", Platform.select({ web: "has-[>svg]:px-2.5" })),
        lg: cn("h-11 px-6 sm:h-10", Platform.select({ web: "has-[>svg]:px-4" })),
        xl: "h-14 px-6",
        fab: "size-14 rounded-full",
        icon: "h-10 w-10 sm:h-9 sm:w-9",
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
    "text-foreground text-sm font-medium leading-[21px] tracking-[-0.16px]",
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
        sm: "",
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

function Button({ className, variant = "default", size, children, ...props }: ButtonProps) {
  const colorScheme = useColorScheme();
  const gradient = variant ? BUTTON_GRADIENTS[variant] : undefined;
  const colors = gradient ? gradient[colorScheme === "dark" ? "dark" : "light"] : undefined;

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && "opacity-50", buttonVariants({ variant, size }), className)}
        role="button"
        {...props}
      >
        {(state) => (
          <>
            {colors ? (
              <>
                <LinearGradient
                  colors={colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: "100%",
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
                      width: "100%",
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
