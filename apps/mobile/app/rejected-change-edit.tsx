import { RejectedChangeEditScreen } from "@/components/rejected-changes/rejected-change-edit-screen";
import { useLocalSearchParams } from "expo-router";

export default function RejectedChangeEditRoute() {
  const params = useLocalSearchParams<{ commandId?: string }>();
  return <RejectedChangeEditScreen commandId={params.commandId ?? null} />;
}
