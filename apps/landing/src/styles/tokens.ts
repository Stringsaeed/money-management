// Trove's single source of truth for color. The landing page reads the same file the
// app does, so a token change lands in both.
import colors from "../../../mobile-next/src/ui/trove/tokens/colors.json";

const kebab = (key: string) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** `bgCanvas` in dark mode → `--dark-bg-canvas: #151515`. */
export const tokenDeclarations = Object.entries(colors)
  .flatMap(([mode, values]) =>
    Object.entries(values).map(([key, value]) => `--${mode}-${kebab(key)}:${value}`),
  )
  .join(";");
