/** Decimals kept when turning a quote's numeric price into a string. */
const PRICE_FRACTION_DIGITS = 8;

/**
 * Quote price as a plain decimal string for `Amount`/`MarketRow`.
 * The API sends prices as JSON numbers, so the string is only as exact as that double: eight
 * fraction digits round away binary float noise (0.1 + 0.2 style), then trailing zeros go.
 * Sub-cent prices beyond eight decimals would be rounded; none of the tracked assets need that.
 */
export function decimalPrice(price: number): string {
  return price.toFixed(PRICE_FRACTION_DIGITS).replace(/0+$/, "").replace(/\.$/, "");
}
