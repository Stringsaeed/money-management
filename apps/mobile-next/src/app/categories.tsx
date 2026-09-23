import { useLocalSearchParams } from "expo-router";

import { CategoriesScreen } from "@/features/ledger/categories/categories-screen";

export default function CategoriesRoute() {
  const { create } = useLocalSearchParams<{ create?: string }>();
  return <CategoriesScreen initialCreate={create === "1"} />;
}
