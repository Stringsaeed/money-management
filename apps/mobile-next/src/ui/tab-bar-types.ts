import type { IconName } from "./icon";

export interface TabBarItem {
  key: string;
  label: string;
  icon: IconName;
}

export interface TabBarProps {
  activeKey: string;
  items?: readonly TabBarItem[];
  onSelect: (key: string) => void;
  onCreate?: () => void;
  createAccessibilityLabel?: string;
}
