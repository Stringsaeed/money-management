import { router } from "expo-router";

import { CategoriesScreen } from "@/features/ledger/categories/categories-screen";

export default function CategoriesRoute() {
  return (
    <CategoriesScreen
      onAddCategory={() => router.push("/categories/new")}
      onEditCategory={(id) => router.push({ pathname: "/categories/[id]", params: { id } })}
    />
  );
}
