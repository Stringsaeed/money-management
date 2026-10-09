import type { ComponentType } from "react";

import { ChartsSection } from "./charts-section";
import { ControlsSection } from "./controls-section";
import { DataSection } from "./data-section";
import { FeedbackSection } from "./feedback-section";
import { FoundationsSection } from "./foundations-section";
import { NavigationSection } from "./navigation-section";
import { TabBarSection } from "./tab-bar-section";

/** Gallery sections in canvas order; the key is the `?section=` deep-link value. */
export const GALLERY_SECTIONS = [
  { key: "foundations", Section: FoundationsSection },
  { key: "controls", Section: ControlsSection },
  { key: "data", Section: DataSection },
  { key: "navigation", Section: NavigationSection },
  { key: "feedback", Section: FeedbackSection },
  { key: "charts", Section: ChartsSection },
  { key: "tab-bar", Section: TabBarSection },
] as const satisfies readonly { key: string; Section: ComponentType }[];

/** Every section, or only the one a `?section=` deep link names. */
export function visibleSections(section: string | undefined) {
  const match = GALLERY_SECTIONS.filter((entry) => entry.key === section);
  return match.length > 0 ? match : GALLERY_SECTIONS;
}
