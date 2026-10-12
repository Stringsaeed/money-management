/** One spoken line for a settings row: title, then its value or "coming soon". */
export function settingsRowLabel(input: { title: string; value?: string; soon: boolean }): string {
  const { title, value, soon } = input;
  if (soon) return `${title}, coming soon`;
  return value ? `${title}, ${value}` : title;
}
