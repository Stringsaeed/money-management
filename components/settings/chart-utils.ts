export const formatCompactChartAmount = (value: number) => {
  const roundedValue = Math.round(value);
  const absoluteValue = Math.abs(roundedValue);

  if (absoluteValue < 1000) {
    return String(roundedValue);
  }

  const compactValue = roundedValue / 1000;
  const formatted =
    absoluteValue >= 10000 ? String(Math.round(compactValue)) : compactValue.toFixed(1);

  return `${formatted.replace(/\.0$/, "")}k`;
};
