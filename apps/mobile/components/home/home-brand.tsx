import { Image } from "react-native";

import TroveLogo from "@/assets/images/icon.png";

import { styles } from "./styles";

export function HomeBrand() {
  return (
    <Image
      accessibilityLabel="Trove"
      resizeMode="contain"
      source={TroveLogo}
      style={styles.homeBrand}
    />
  );
}
