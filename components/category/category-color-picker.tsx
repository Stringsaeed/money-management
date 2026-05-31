import { ColorPicker } from "@/components/common/color-picker";

interface CategoryColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategoryColorPicker({ value, onChange }: CategoryColorPickerProps) {
  return <ColorPicker value={value} onChange={onChange} />;
}
