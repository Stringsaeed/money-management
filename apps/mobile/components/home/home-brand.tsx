import { Image } from "react-native";

import TroveLogo from "@/assets/images/icon.png";

export function HomeBrand() {
  return (
    <Image
      accessibilityLabel="Trove"
      className="size-12 p-2"
      resizeMode="contain"
      source={TroveLogo}
    />
  );
}
