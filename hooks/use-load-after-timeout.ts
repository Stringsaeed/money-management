import { useEffect, useState } from "react";

export function useLoadAfterTimeout<T>(value: T, initialValue: T, timeout: number) {
  const [state, setState] = useState<T>(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setState(value);
    }, timeout);

    return () => clearTimeout(timer);
  }, [value, timeout]);

  return state;
}
