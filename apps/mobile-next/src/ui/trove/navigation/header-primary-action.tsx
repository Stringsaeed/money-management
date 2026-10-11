import { Button } from "../controls";
import type { IconName } from "../icon";

export interface HeaderPrimaryAction {
  /** Visible text, e.g. "Add". */
  label: string;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
}

/** The accent pill beside a large title: the one affirmative action on the screen. */
export function HeaderPrimaryActionButton({ label, icon, onPress, disabled }: HeaderPrimaryAction) {
  return <Button disabled={disabled} icon={icon} label={label} onPress={onPress} size="md" />;
}
