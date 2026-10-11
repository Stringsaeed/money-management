import type { ReactNode } from "react";

import { CheckboxBox } from "../controls/checkbox-box";
import type { IconName } from "../icon";
import { ListRowIcon } from "./list-row-icon";

interface ListRowLeadProps {
  leading?: ReactNode;
  checked?: boolean;
  disabled: boolean;
  destructive: boolean;
  icon?: IconName;
}

/** The row's leading slot: custom content, else a checkbox (selectable rows), else the icon tile. */
export function ListRowLead({ leading, checked, disabled, destructive, icon }: ListRowLeadProps) {
  if (leading) return leading;
  if (checked !== undefined) return <CheckboxBox checked={checked} disabled={disabled} />;
  return icon ? <ListRowIcon destructive={destructive} name={icon} /> : null;
}
