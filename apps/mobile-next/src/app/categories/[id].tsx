import { router, useLocalSearchParams } from "expo-router";

import { CategoryEditorScreen } from "@/features/ledger/categories/category-editor-screen";

export default function EditCategoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CategoryEditorScreen id={id} onDone={() => router.back()} />;
}
