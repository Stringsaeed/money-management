export type SetupAssignmentParseResult =
  | { valid: true; amountMinor: number }
  | { valid: false; message: string };

export function parseSetupAssignment(value: string): SetupAssignmentParseResult {
  const trimmed = value.trim();
  if (trimmed === "") return { valid: true, amountMinor: 0 };
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    return {
      valid: false,
      message:
        "Enter a positive amount with no more than two decimal places, or clear it for zero.",
    };
  }
  const [whole, fraction = ""] = trimmed.split(".");
  const amountMinor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amountMinor)) {
    return {
      valid: false,
      message: "This Assignment is too large. Enter a smaller positive amount.",
    };
  }
  return { valid: true, amountMinor };
}
