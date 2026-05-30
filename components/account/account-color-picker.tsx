import { ColorPicker } from "@/components/common/color-picker";

interface AccountColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function AccountColorPicker({ value, onChange }: AccountColorPickerProps) {
  return <ColorPicker value={value} onChange={onChange} />;
}
