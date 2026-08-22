import { Modal, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAppUpdate } from "@/hooks/use-app-update";

const handleRequestClose = () => undefined;

export function MandatoryUpdateGate() {
  const { error, isMandatory, progress, retryMandatoryUpdate, status } = useAppUpdate();

  if (!isMandatory) {
    return null;
  }

  const progressLabel = `${Math.round((progress ?? 0) * 100)}%`;
  const isFailed = status === "error";

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleRequestClose}
      presentationStyle="fullScreen"
      visible
    >
      <View className="flex-1 items-center justify-center bg-surface px-8 pt-safe pb-safe">
        <View className="w-full max-w-md items-center gap-4 bg-surface-container px-6 py-8">
          <Text className="text-4xl">🔄</Text>
          <Text className="text-center font-heading-normal text-2xl italic text-ink">
            Update required
          </Text>
          <Text className="text-center font-body-normal text-sm leading-6 text-ink/60">
            {isFailed
              ? error
              : "A required update is being installed to keep Trove working safely."}
          </Text>
          {status === "downloading" ? (
            <Text className="font-body-semibold text-base text-ink">
              Downloading {progressLabel}
            </Text>
          ) : null}
          {status === "restarting" ? (
            <Text className="font-body-semibold text-base text-ink">Restarting…</Text>
          ) : null}
          {isFailed ? (
            <Button className="mt-2 w-full" onPress={retryMandatoryUpdate}>
              <Text>Retry Update</Text>
            </Button>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
