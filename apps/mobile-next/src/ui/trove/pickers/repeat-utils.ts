import { format } from "date-fns";

export type RepeatRule = "none" | "weekly" | "monthly" | "yearly";

export const REPEAT_RULES = [
  "none",
  "weekly",
  "monthly",
  "yearly",
] as const satisfies readonly RepeatRule[];

const SENTENCES = {
  none: () => "Doesn't repeat",
  weekly: (date) => `Every week on ${format(date, "EEEE")}`,
  monthly: (date) => `Every month on the ${format(date, "do")}`,
  yearly: (date) => `Every year on ${format(date, "d MMMM")}`,
} as const satisfies Record<RepeatRule, (date: Date) => string>;

/** Plain-text repeat sentence built from the picked date, e.g. "Every month on the 10th". */
export const repeatSentence = (rule: RepeatRule, date: Date): string => SENTENCES[rule](date);

export interface RepeatChoice {
  rule: RepeatRule;
  label: string;
}

export const repeatChoices = (date: Date): readonly RepeatChoice[] =>
  REPEAT_RULES.map((rule) => ({ rule, label: repeatSentence(rule, date) }));
