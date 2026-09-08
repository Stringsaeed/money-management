const LIST_PADDING_TOP = 12;
const LIST_GAP = 8;

export function accountCurrencyListOffset(index: number, rowLength: number): number {
  return LIST_PADDING_TOP + index * (rowLength + LIST_GAP);
}

export function recoverAccountCurrencyListScroll(
  list: { scrollToOffset: (params: { offset: number; animated: boolean }) => void } | null,
  info: { index: number; averageItemLength: number },
): void {
  list?.scrollToOffset({
    offset: accountCurrencyListOffset(info.index, info.averageItemLength),
    animated: false,
  });
}
