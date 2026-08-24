import type { ActivityEntry } from "@/hooks/use-activity";

export interface ActivityEntryRowProps {
  readonly entry: ActivityEntry;
  /** Tap handler — opens the entry's detail sheet on the timeline screen. */
  readonly onPress?: (entry: ActivityEntry) => void;
}

export interface ActivityUserOption {
  readonly userId: string;
  readonly userName: string;
}
