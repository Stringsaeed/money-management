import { ACCOUNT_ICON_OPTIONS } from "@/components/account/account-form-options";
import { EmojiPicker } from "@/components/common/emoji-picker";

interface AccountIconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function AccountIconPicker({ value, onChange }: AccountIconPickerProps) {
  return <EmojiPicker onChange={onChange} options={ACCOUNT_ICON_OPTIONS} value={value} />;
}
