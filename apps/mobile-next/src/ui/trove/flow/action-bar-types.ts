export interface ActionBarAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Spinner in place of the label; blocks presses. */
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export interface ActionBarPrimary extends ActionBarAction {
  /** `negative` for a destructive or over-budget action, e.g. "Cover AED 175". */
  tone?: "accent" | "negative";
}

export interface ActionBarSecondary extends ActionBarAction {
  /**
   * outline: 1.5pt ring, both buttons share the width (envelope) · text: bare label, the
   * primary takes two thirds (wrap-up "Skip").
   */
  appearance?: "outline" | "text";
}
