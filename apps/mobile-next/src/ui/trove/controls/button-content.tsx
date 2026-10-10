import { ActivityIndicator, View } from "react-native";

import { Icon, type IconName } from "../icon";
import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE, colors } from "../tokens";
import {
  baseStyles,
  ICON_SIZE,
  LABEL,
  LABEL_VARIANT,
  type ButtonSize,
  type ButtonVariant,
} from "./button-styles";

interface ButtonContentProps {
  variant: ButtonVariant;
  size: ButtonSize;
  label: string;
  icon?: IconName;
  loading: boolean;
  disabled: boolean;
}

/** Icon + label row. While loading the row keeps its width but hides under a spinner. */
export function ButtonContent({
  variant,
  size,
  label,
  icon,
  loading,
  disabled,
}: ButtonContentProps) {
  const spec = LABEL[variant];
  const tone = disabled ? "disabled" : spec.tone;
  const color = disabled ? colors.text.disabled : spec.color;

  return (
    <>
      <View style={[baseStyles.content, loading ? baseStyles.hidden : null]}>
        {icon ? <Icon color={color} name={icon} size={ICON_SIZE[size]} /> : null}
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          tone={tone}
          variant={LABEL_VARIANT[size]}
        >
          {label}
        </Text>
      </View>
      {loading ? (
        <View style={baseStyles.spinner}>
          <ActivityIndicator color={color} />
        </View>
      ) : null}
    </>
  );
}
