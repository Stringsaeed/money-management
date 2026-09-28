import { router } from "expo-router";

import { CategoryEditorScreen } from "@/features/ledger/categories/category-editor-screen";

export default function NewCategoryRoute() {
  return <CategoryEditorScreen onDone={() => router.back()} />;
}
