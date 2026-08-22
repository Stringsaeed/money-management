import { TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Platform, Pressable } from "react-native";

// NOTE: group-* is not supported yet by Uniwind

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
          "relative bg-[#619eff] bg-linear-to-b from-kumo-brand-emphasis-start to-kumo-brand-emphasis-end text-white ring ring-[#045ede] inset-shadow-[0_1px_0_0_#619eff] disabled:opacity-50 dark:bg-[#5491f6] dark:ring-[#004dcc] dark:inset-shadow-[0_1px_0_0_#5491f6]",
          Platform.select({
            web: "focus:ring-[#045ede] focus-visible:ring-2 focus-visible:ring-[#045ede] active:ring-[#045ede] dark:focus:ring-[#004dcc] dark:focus-visible:ring-[#004dcc] dark:active:ring-[#004dcc]",
          }),
        ),
        destructive: cn(
          "relative bg-[#ff7d75] bg-linear-to-b from-[#ff5b57] to-[#fb2c36] text-white ring ring-[#da252e] inset-shadow-[0_1px_0_0_#ff7d75] active:from-[#ff7d75] disabled:opacity-50 dark:bg-[#f86e62] dark:from-[#f0463e] dark:to-[#e7000b] dark:ring-[#c90008] dark:inset-shadow-[0_1px_0_0_#f86e62] dark:active:from-[#f86e62]",
          Platform.select({
            web: "hover:from-[#ff7d75] focus:ring-[#da252e] focus-visible:ring-2 focus-visible:ring-[#da252e] active:ring-[#da252e] dark:hover:from-[#f86e62] dark:focus:ring-[#c90008] dark:focus-visible:ring-[#c90008] dark:active:ring-[#c90008]",
          }),
        ),
        secondary: cn(
          "bg-linear-to-b from-[#8db99e] to-[#6e9c80] border border-white/25 shadow-sm shadow-black/5 active:opacity-90 dark:from-[#a3c3b0] dark:to-[#6e9c80] inset-shadow-[0_1px_0_0_rgba(255,255,255,0.16)]",
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
        fab: "size-14 rounded-full absolute bottom-8 right-5",
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

function Button({ className, variant = "default", size, children, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && "opacity-50", buttonVariants({ variant, size }), className)}
        role="button"
        {...props}
      >
        {children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { Button };
