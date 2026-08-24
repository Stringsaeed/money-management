/**
 * Derives a flat, editable field list from an opaque command payload so the
 * re-edit screen (#94) can pre-populate a form without knowing each handler's
 * schema. Only top-level scalar entries become inputs; nested objects are
 * preserved as-is on save.
 */

export type EditableFieldKind = "string" | "number" | "boolean";

export interface EditableField {
  key: string;
  kind: EditableFieldKind;
  /** Raw text input value; numbers/booleans are stringified here. */
  value: string;
}

export const READONLY_FIELD_KEYS = ["commandId", "householdId"] as const;

export function buildEditableFields(payload: unknown): readonly EditableField[] {
  if (typeof payload !== "object" || payload === null) {
    return [];
  }
  return Object.entries(payload as Record<string, unknown>)
    .filter(([key]) => !(READONLY_FIELD_KEYS as readonly string[]).includes(key))
    .filter(([, value]) => {
      return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
    })
    .map(([key, value]) => ({
      key,
      kind:
        typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string",
      value: String(value),
    }));
}

/**
 * Rebuilds the payload from edited fields. Unrecognized/nested entries pass
 * through untouched; number fields fall back to their original value when the
 * edited text is not numeric.
 */
export function fieldsToPayload(
  fields: readonly EditableField[],
  original: unknown,
): Record<string, unknown> {
  const base =
    typeof original === "object" && original !== null
      ? ({ ...(original as Record<string, unknown>) } as Record<string, unknown>)
      : {};
  for (const field of fields) {
    if (field.kind === "number") {
      const parsed = Number(field.value);
      base[field.key] = Number.isFinite(parsed) ? parsed : Number(base[field.key] ?? 0);
    } else if (field.kind === "boolean") {
      base[field.key] = field.value === "true";
    } else {
      base[field.key] = field.value;
    }
  }
  return base;
}
