import { useReducer } from "react";

interface NumberState {
  displayValue: string;
  value: number;
  isDecimal: boolean;
  decimalPlaces: number;
}

interface Action {
  type: "APPEND_DIGIT" | "DECIMAL_POINT" | "DELETE_DIGIT" | "CLEAR_ALL";
  digit?: number;
}

const MAX_DIGITS = 13;
const MAX_DECIMAL_PLACES = 2;

const createStateFromValue = (initialValue: number): NumberState => {
  if (!initialValue) {
    return {
      value: 0,
      isDecimal: false,
      decimalPlaces: 0,
      displayValue: "0",
    };
  }

  const hasDecimals = !Number.isInteger(initialValue);
  const rawValue = hasDecimals ? initialValue.toFixed(MAX_DECIMAL_PLACES) : initialValue.toString();
  const decimalPlaces = hasDecimals ? rawValue.split(".")[1]!.length : 0;

  return {
    value: initialValue,
    isDecimal: hasDecimals,
    decimalPlaces,
    displayValue: formatDisplayValue(rawValue),
  };
};

function numberReducer(state: NumberState, action: Action): NumberState {
  switch (action.type) {
    case "APPEND_DIGIT":
      return handleAppendDigit(state, action.digit ?? 0);
    case "DECIMAL_POINT":
      return handleDecimalPoint(state);
    case "DELETE_DIGIT":
      return handleDeleteDigit(state);
    case "CLEAR_ALL":
      return createStateFromValue(0);
    /* istanbul ignore next -- Action is an exhaustive union */
    default:
      return state;
  }
}

function handleAppendDigit(state: NumberState, digit: number): NumberState {
  if (state.displayValue.replace(/[.,]/g, "").length >= MAX_DIGITS) {
    return state;
  }

  if (state.isDecimal && state.decimalPlaces >= MAX_DECIMAL_PLACES) {
    return state;
  }

  let newDisplayValue = state.displayValue;

  if (state.displayValue === "0" && digit !== 0) {
    newDisplayValue = digit.toString();
  } else if (state.displayValue === "0" && !state.isDecimal) {
    newDisplayValue = digit.toString();
  } else {
    newDisplayValue = state.displayValue + digit.toString();
  }

  const rawValue = parseFloat(newDisplayValue.replace(/,/g, "")) || 0;

  return {
    ...state,
    value: rawValue,
    displayValue: formatDisplayValue(newDisplayValue),
    decimalPlaces: state.isDecimal ? state.decimalPlaces + 1 : 0,
  };
}

function handleDecimalPoint(state: NumberState): NumberState {
  if (state.isDecimal) {
    return state;
  }

  return {
    ...state,
    isDecimal: true,
    displayValue: state.displayValue + ".",
  };
}

function handleDeleteDigit(state: NumberState): NumberState {
  if (state.displayValue.length <= 1) {
    return createStateFromValue(0);
  }

  const newDisplayValue = state.displayValue.slice(0, -1);
  const normalizedValue = newDisplayValue.endsWith(".")
    ? newDisplayValue.slice(0, -1)
    : newDisplayValue;
  const nextValue = parseFloat(normalizedValue.replace(/,/g, ""));

  return {
    value: nextValue,
    isDecimal: newDisplayValue.includes("."),
    decimalPlaces: newDisplayValue.includes(".") ? newDisplayValue.split(".")[1]!.length : 0,
    displayValue: formatDisplayValue(newDisplayValue),
  };
}

function formatDisplayValue(displayValue: string) {
  const [integerPart, decimalPart = ""] = displayValue.split(".");
  const formattedInteger = addCommasToInteger(integerPart);

  if (displayValue.endsWith(".")) {
    return `${formattedInteger}.`;
  }

  if (decimalPart) {
    return `${formattedInteger}.${decimalPart}`;
  }

  return formattedInteger;
}

function addCommasToInteger(integerPart: string) {
  const numericValue = parseFloat(integerPart.replace(/,/g, ""));

  /* istanbul ignore next -- integerPart is always numeric through the public reducer API */
  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  return numericValue.toLocaleString("en-US");
}

function useNumPadNumber(initialValue = 0) {
  const [state, dispatch] = useReducer(numberReducer, initialValue, createStateFromValue);

  const appendDigit = (digit: number) => {
    dispatch({ type: "APPEND_DIGIT", digit });
  };

  const addDecimalPoint = () => {
    dispatch({ type: "DECIMAL_POINT" });
  };

  const deleteDigit = () => {
    dispatch({ type: "DELETE_DIGIT" });
  };

  const clearAll = () => {
    dispatch({ type: "CLEAR_ALL" });
  };

  return {
    displayValue: state.displayValue,
    value: state.value,
    isDecimal: state.isDecimal,
    decimalPlaces: state.decimalPlaces,
    appendDigit,
    addDecimalPoint,
    deleteDigit,
    clearAll,
  };
}

export default useNumPadNumber;
