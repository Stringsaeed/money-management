export function formatPrice(value: number | null, currency: string) {
  if (value === null) return "--";

  const maximumFractionDigits = value >= 100 ? 2 : 4;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(value);
}

export function formatSignedPercent(value: number | null) {
  if (value === null) return "--";

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
