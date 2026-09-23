export const scheduleOnRN = <T extends readonly unknown[]>(
  callback: (...args: T) => void,
  ...args: T
): void => {
  callback(...args);
};
