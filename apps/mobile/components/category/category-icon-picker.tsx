import { EmojiPicker } from "@/components/common/emoji-picker";

interface CategoryIconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategoryIconPicker({ value, onChange }: CategoryIconPickerProps) {
  return <EmojiPicker value={value} onChange={onChange} />;
}
