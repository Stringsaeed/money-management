import {
  Button,
  IconButton,
  QuickAction,
  type ButtonSize,
  type ButtonVariant,
  type IconButtonVariant,
} from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { GalleryRow } from "./gallery-row";
import { noop } from "./utils";

const VARIANTS = [
  "primary",
  "secondary",
  "tertiary",
  "delete",
] as const satisfies readonly ButtonVariant[];
const SIZES = ["lg", "md", "sm"] as const satisfies readonly ButtonSize[];
const ICON_VARIANTS = [
  "neutral",
  "ghost",
  "primary",
] as const satisfies readonly IconButtonVariant[];

export function ButtonsShowcase() {
  return (
    <>
      {VARIANTS.map((variant) => (
        <GalleryGroup key={variant} label={`BUTTON · ${variant.toUpperCase()} · LG MD SM`}>
          <GalleryRow>
            {SIZES.map((size) => (
              <Button
                key={size}
                label={`Button ${size}`}
                onPress={noop}
                size={size}
                variant={variant}
              />
            ))}
          </GalleryRow>
        </GalleryGroup>
      ))}
      <GalleryGroup label="BUTTON · DISABLED">
        <GalleryRow>
          {VARIANTS.map((variant) => (
            <Button disabled key={variant} label={variant} onPress={noop} variant={variant} />
          ))}
        </GalleryRow>
      </GalleryGroup>
      <GalleryGroup label="BUTTON · LOADING">
        <GalleryRow>
          {VARIANTS.map((variant) => (
            <Button key={variant} label={variant} loading onPress={noop} variant={variant} />
          ))}
        </GalleryRow>
      </GalleryGroup>
      <GalleryGroup label="BUTTON · FULL WIDTH WITH ICON">
        <Button fullWidth icon="add" label="Add transaction" onPress={noop} size="lg" />
        <Button fullWidth icon="trash" label="Delete category" onPress={noop} variant="delete" />
      </GalleryGroup>
      <GalleryGroup label="ICON BUTTON · NEUTRAL GHOST PRIMARY · DISABLED">
        <GalleryRow>
          {ICON_VARIANTS.map((variant) => (
            <IconButton
              accessibilityLabel={`Search ${variant}`}
              icon="search"
              key={variant}
              onPress={noop}
              variant={variant}
            />
          ))}
          <IconButton accessibilityLabel="Search disabled" disabled icon="search" onPress={noop} />
        </GalleryRow>
      </GalleryGroup>
      <GalleryGroup label="QUICK ACTION">
        <GalleryRow>
          <QuickAction emphasis="primary" icon="add" label="Add" onPress={noop} />
          <QuickAction icon="expense" label="Send" onPress={noop} />
          <QuickAction icon="transfer" label="Move" onPress={noop} />
          <QuickAction icon="income" label="Request" onPress={noop} />
        </GalleryRow>
      </GalleryGroup>
    </>
  );
}
