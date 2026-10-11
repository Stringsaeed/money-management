/** Minor units in one whole unit of `currency`: 100 for AED, 1000 for KWD, 1 for JPY. */
export function minorUnitsPerWhole(currency: string): number {
  const digits =
    new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  return 10 ** digits;
}
