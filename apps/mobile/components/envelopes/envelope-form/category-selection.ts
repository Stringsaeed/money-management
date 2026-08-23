export function changedCategoryIds(
  initialCategoryIds: readonly string[],
  categoryIds: readonly string[],
): string[] {
  const initial = new Set(initialCategoryIds);
  const current = new Set(categoryIds);
  return [...new Set([...initial, ...current])].filter(
    (categoryId) => initial.has(categoryId) !== current.has(categoryId),
  );
}
