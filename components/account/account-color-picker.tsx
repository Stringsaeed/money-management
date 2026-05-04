import { Platform, View } from "react-native";
import { ColorPicker as SwiftUIColorPicker, Host } from "@expo/ui/swift-ui";

import { ColorPicker as PaletteColorPicker } from "@/components/common/color-picker";

interface AccountColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function AccountColorPicker({ value, onChange }: AccountColorPickerProps) {
  if (Platform.OS !== "ios") {
    return <PaletteColorPicker value={value} onChange={onChange} />;
  }

  return (
    <View className="rounded-2xl border border-ledger-outline bg-surface px-4 py-3">
      <Host matchContents>
        <SwiftUIColorPicker selection={value} onSelectionChange={onChange} />
      </Host>
    </View>
  );
}
