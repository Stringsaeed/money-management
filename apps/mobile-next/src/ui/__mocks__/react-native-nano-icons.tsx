import { View } from "react-native";

interface NanoIconProps {
  readonly name: string;
  readonly testID?: string;
}

/** The package's CommonJS build is incomplete, so tests render icons as plain views. */
export const createNanoIconSet = () =>
  function NanoIcon({ name, testID }: NanoIconProps) {
    return <View testID={testID ?? `nano-icon-${name}`} />;
  };
