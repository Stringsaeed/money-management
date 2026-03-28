import { useLayoutEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { X } from "phosphor-react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { SpectralWave } from "@/components/ui/organisms/spectral-wave";

export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const targetRef = useRef<View>(null);
  const [viewMeasurements, setViewMeasurements] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (targetRef.current) {
      targetRef.current.measure((_, __, width, height) => {
        setViewMeasurements({ width, height });
      });
    }
  }, []);

  return (
    <SpectralWave
      width={viewMeasurements.width + 4}
      height={viewMeasurements.height + 4}
      borderRadius={4}
      asChild
      timeScale={1.5}
      colors={["#000", "#c7d2fe", "#fbcfe8"]}
    >
      <View
        ref={targetRef}
        className="flex-row bg-accent items-center gap-1.5 border border-ledger-outline pl-3 pr-1.5 py-1.5 rounded-sm"
      >
        <Text className="font-body-medium text-[11px] text-ink/60 uppercase tracking-wide">
          {label}
        </Text>
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          className="w-5 h-5 items-center justify-center rounded-full active:bg-ink/5"
        >
          <Icon as={X} size={10} className="text-ink/30" />
        </Pressable>
      </View>
    </SpectralWave>
  );
}
