/**
 * Trove icon set: 24×24 grid, art inside the 20pt square, 1.75pt round strokes.
 * One SVG path per icon. Navigation icons carry a filled twin for the selected tab.
 */

const n = (v: number) => +v.toFixed(2);

/** Circle as two arcs. */
const circle = (cx: number, cy: number, r: number) =>
  `M${n(cx - r)} ${cy}a${r} ${r} 0 1 0 ${n(2 * r)} 0a${r} ${r} 0 1 0 ${n(-2 * r)} 0`;

/** Rounded rectangle. */
const rect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${n(x + r)} ${y}h${n(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${n(h - 2 * r)}` +
  `a${r} ${r} 0 0 1 ${-r} ${r}h${n(-(w - 2 * r))}a${r} ${r} 0 0 1 ${-r} ${-r}` +
  `v${n(-(h - 2 * r))}a${r} ${r} 0 0 1 ${r} ${-r}z`;

const gear = () => {
  const points: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const p = (r: number, da: number) =>
      `${n(12 + r * Math.cos(a + da))} ${n(12 + r * Math.sin(a + da))}`;
    points.push(p(7, -0.28), p(9.5, -0.17), p(9.5, 0.17), p(7, 0.28));
  }
  return `M${points.join("L")}z`;
};

const home = "M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z";
const tag =
  "M3.5 12.1V5A1.5 1.5 0 0 1 5 3.5h7.1a1.5 1.5 0 0 1 1.06.44l7.4 7.4a1.5 1.5 0 0 1 0 2.12l-7.1 7.1a1.5 1.5 0 0 1-2.12 0l-7.4-7.4a1.5 1.5 0 0 1-.44-1.06z" +
  circle(8.5, 8.5, 1.25);

/** Outline + filled twins, for the tab bar. */
export const NAV_ICONS = {
  home: { outline: home, filled: home },
  ledger: {
    outline:
      "M12 6.5C10.5 5.3 8.5 4.8 4 5v13c4.5-.2 6.5.3 8 1.5 1.5-1.2 3.5-1.7 8-1.5V5c-4.5-.2-6.5.3-8 1.5zM12 6.5v13",
    filled:
      "M11.25 6.1C9.7 5 7.6 4.6 3.25 4.75V18.6c4.2-.15 6.2.3 8 1.4zM12.75 6.1C14.3 5 16.4 4.6 20.75 4.75V18.6c-4.2-.15-6.2.3-8 1.4z",
  },
  insights: {
    outline: "M4 4v15a1 1 0 0 0 1 1h15M7.5 15l3.5-4 3 2.5 5.5-5.5M16 8h3.5v3.5",
    filled:
      "M3.25 3.25h1.5V19.25h16v1.5H4.5a1.25 1.25 0 0 1-1.25-1.25zM6.5 18V14.6l4.4-4.9 3 2.5L19.75 6.4V18z",
  },
  settings: { outline: gear() + circle(12, 12, 3), filled: gear() + circle(12, 12, 3) },
  market: {
    outline:
      "M7.5 3.5v3.5M7.5 16v4.5M16.5 3.5v6M16.5 16.5v4M6 7h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM15 9.5h3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1z",
    filled:
      "M6 7h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM15 9.5h3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1zM6.75 3h1.5v4h-1.5zM6.75 16h1.5v5h-1.5zM15.75 3h1.5v6.5h-1.5zM15.75 16.5h1.5v4.5h-1.5z",
  },
  accounts: {
    outline:
      "M4 7.5A2.5 2.5 0 0 1 6.5 5H18a1 1 0 0 1 1 1v2M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5z" +
      circle(16, 13.5, 0.6),
    filled: rect(3.25, 6.25, 17.5, 13.5, 2.75) + circle(16, 13, 1.25),
  },
} as const;

export const UI_ICONS = {
  add: "M12 5v14M5 12h14",
  search: circle(11, 11, 6.5) + "M20 20l-4.4-4.4",
  filter: "M4 5h16l-6 7.5V18l-4 2v-7.5z",
  close: "M6 6l12 12M18 6L6 18",
  check: "M5 12.5l4.5 4.5L19 7.5",
  "chevron-right": "M9.5 6l6 6-6 6",
  "chevron-left": "M14.5 6l-6 6 6 6",
  "chevron-down": "M6 9.5l6 6 6-6",
  more: circle(5.5, 12, 0.75) + circle(12, 12, 0.75) + circle(18.5, 12, 0.75),
  calendar: rect(4, 5.5, 16, 14.5, 2.5) + "M4 10h16M8.5 3.5v4M15.5 3.5v4",
  note: "M14.5 5.5l4 4M4 20l1-4.5L15.8 4.7a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5L8.5 19z",
  recurring: "M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4",
  category: "M4 6h16M4 12h16M4 18h16",
  tag,
  transfer: "M7 4.5L3.5 8 7 11.5M3.5 8h17M17 12.5l3.5 3.5-3.5 3.5M20.5 16h-17",
  expense: "M7 17L17 7M8.5 7H17v8.5",
  income: "M17 7L7 17M15.5 17H7V8.5",
  bank: "M3.5 9.5L12 4l8.5 5.5zM5.5 10v7.5M10 10v7.5M14 10v7.5M18.5 10v7.5M3.5 20.5h17",
  receipt:
    "M5.5 3.5h13v17l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5-2.1-1.5-2.2 1.5zM9 8.5h6M9 12h6M9 15.5h3.5",
  bell: "M6 9.5a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15.5 6 9.5M10 20.5a2.2 2.2 0 0 0 4 0",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" + circle(12, 12, 3),
  "eye-off":
    "M3.5 3.5l17 17M10.6 5.6A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.8 3.6M6.6 6.6C4 8.3 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.9 0 3.5-.6 4.9-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2",
  lock: rect(5, 10.5, 14, 10, 2.5) + "M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2",
  trash:
    "M4 6.5h16M9.5 6.5v-2h5v2M6 6.5l1 12.5a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4l1-12.5M10 11v5.5M14 11v5.5",
  info: circle(12, 12, 9) + "M12 11v5.5M12 7.75v.01",
  warning:
    "M10.3 4.5a2 2 0 0 1 3.4 0l7.5 13a2 2 0 0 1-1.7 3H4.5a2 2 0 0 1-1.7-3zM12 9.5v4M12 16.75v.01",
  backspace: "M20.5 5.5H9L3.5 12 9 18.5h11.5zM16.5 9.5l-5 5M11.5 9.5l5 5",
  "chart-bar": "M4 4v15a1 1 0 0 0 1 1h15M8.5 16.5v-5M12.5 16.5V8M16.5 16.5v-3.5",
  "chart-line": "M4 4v15a1 1 0 0 0 1 1h15M7.5 15l3.5-4 3 2.5 5.5-5.5",
  sparkle:
    "M12 3.5l1.6 4.9 4.9 1.6-4.9 1.6L12 16.5l-1.6-4.9L5.5 10l4.9-1.6zM18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z",
  "scope-personal": circle(12, 8.5, 3.5) + "M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5",
  "scope-household":
    "M3.5 11L12 4l8.5 7M5.5 9.5V20h13V9.5" +
    circle(12, 13, 1.8) +
    "M9 19c.4-1.8 1.5-2.8 3-2.8s2.6 1 3 2.8",
  volume: "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10",
  /** System kinds: shown in tiles so they can't be mistaken for a user-named category. */
  "kind-income": "M17 7L7 17M15.5 17H7V8.5",
  "kind-expense": "M7 17L17 7M8.5 7H17v8.5",
  "kind-transfer": "M7 4.5L3.5 8 7 11.5M3.5 8h17M17 12.5l3.5 3.5-3.5 3.5M20.5 16h-17",
} as const;

export const CATEGORY_ICONS = {
  groceries:
    "M3 4h2.2l2.3 10.7a1.2 1.2 0 0 0 1.2.9h8.6a1.2 1.2 0 0 0 1.2-.9L20.5 8H6" +
    circle(9, 19.5, 1.25) +
    circle(17, 19.5, 1.25),
  dining:
    "M6.5 3.5v6a2 2 0 0 0 2 2M10.5 3.5v6a2 2 0 0 1-2 2v9M8.5 3.5v5M17.5 20.5v-17c-2.2 1-3.5 3.6-3.5 7v3.5h3.5",
  coffee:
    "M4.5 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM16.5 10.5h1a2.5 2.5 0 0 1 0 5h-1.3M8 3.5V6M11.5 3.5V6M3.5 21h14",
  "fast-food":
    "M4.5 11a7.5 6 0 0 1 15 0zM3.5 14.5h17M4.5 17.5h15v.5a2.5 2.5 0 0 1-2.5 2.5h-10A2.5 2.5 0 0 1 4.5 18z",
  car: "M4 16.5v-4l1.9-4.6A2 2 0 0 1 7.8 6.5h8.4a2 2 0 0 1 1.9 1.4l1.9 4.6v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 12.5h16M6.5 17.5v2M17.5 17.5v2M7 15h1M16 15h1",
  fuel: "M4.5 20.5v-15a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15M3.5 20.5h12M7 8h5M14.5 11h2a1.5 1.5 0 0 1 1.5 1.5v4a1.25 1.25 0 0 0 2.5 0V8.5L18 6",
  transit: rect(5, 3.5, 14, 15, 3) + "M5 11h14M8 18.5v2M16 18.5v2M8.5 15h.01M15.5 15h.01M9 6.5h6",
  travel:
    "M12 2.5c1 0 1.5 1 1.5 2.5v4.5l7 4v2l-7-2v4l2 1.5v1.5l-3.5-1-3.5 1V19l2-1.5v-4l-7 2v-2l7-4V5c0-1.5.5-2.5 1.5-2.5z",
  housing: "M3.5 11L12 4l8.5 7M5.5 9.5V20h13V9.5M10 20v-5h4v5",
  utilities:
    "M9 17.5h6M10 20.5h4M12 3.5a6 6 0 0 0-3.5 10.9c.4.3.5.7.5 1.1v2h5v-2c0-.4.1-.8.5-1.1A6 6 0 0 0 12 3.5z",
  phone: rect(6.5, 2.5, 11, 19, 2.5) + "M10.5 18.5h3",
  internet:
    circle(12, 12, 8.5) +
    "M3.5 12h17M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.2-3.5-8.5S9.7 5.8 12 3.5z",
  shopping: "M5 8h14l-1 12.5H6zM9 8V6.5a3 3 0 0 1 6 0V8",
  clothing:
    "M8.5 3.5L4 5.5 2.5 10l3 1 1-2v11.5h11V9l1 2 3-1L20 5.5l-4.5-2c-.5 1.5-1.8 2.5-3.5 2.5s-3-1-3.5-2.5z",
  pharmacy: "M10.5 20.5a4.95 4.95 0 0 1-7-7l6-6a4.95 4.95 0 0 1 7 7zM8.5 8.5l7 7",
  health:
    "M12 20.5l-7.5-7.5c-1.3-1.3-2-2.9-2-4.5A4.5 4.5 0 0 1 7 4c1.8 0 3 .5 5 2.5C14 4.5 15.2 4 17 4a4.5 4.5 0 0 1 4.5 4.5c0 1.6-.7 3.2-2 4.5zM6 12h2.5l1.5-2.5 3 5 1.5-2.5H18",
  fitness: rect(4.5, 7, 3, 10, 1) + rect(16.5, 7, 3, 10, 1) + "M7.5 12h9M2.5 10v4M21.5 10v4",
  movies:
    rect(3.5, 9, 17, 11.5, 2) + "M3.6 8.6L19.5 4.4l-.7-2.5L3 6.1zM8.2 5L10 7.5M13.5 3.6l1.8 2.5",
  gaming:
    "M7.5 7.5h9a4.5 4.5 0 0 1 4.4 3.6l.9 4.6a2.5 2.5 0 0 1-4.3 2.2L15.5 16h-7l-2 1.9a2.5 2.5 0 0 1-4.3-2.2l.9-4.6a4.5 4.5 0 0 1 4.4-3.6zM7.5 10.5v3M6 12h3M15 11.5h.01M17.5 13h.01",
  music: "M9 18V5.5l11-2V16" + circle(6.5, 18, 2.5) + circle(17.5, 16, 2.5),
  books: "M4.5 19V5.5a2 2 0 0 1 2-2h12v14h-12a2 2 0 0 0-2 2 2 2 0 0 0 2 2h12M8.5 7.5h6",
  education:
    "M2.5 9.5L12 5l9.5 4.5L12 14zM6.5 11.5V16c1.5 1.5 3.5 2.5 5.5 2.5s4-1 5.5-2.5v-4.5M21.5 9.5v5",
  pets:
    circle(8.5, 6, 1.75) +
    circle(15.5, 6, 1.75) +
    circle(4.5, 11, 1.75) +
    circle(19.5, 11, 1.75) +
    "M12 11.5c-2.5 0-5 3.5-5 6A2.5 2.5 0 0 0 9.5 20c1 0 1.5-.5 2.5-.5s1.5.5 2.5.5a2.5 2.5 0 0 0 2.5-2.5c0-2.5-2.5-6-5-6z",
  kids:
    circle(12, 12.5, 8) +
    "M9 12.5h.01M15 12.5h.01M10 16a3 3 0 0 0 4 0M12 4.5c-1 0-1.5.7-1.5 1.3s.6 1 1.2 1",
  gifts:
    rect(3.5, 8, 17, 4, 1) +
    "M5 12v7.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V12M12 8v12.5M12 8C10.5 4 7 3.5 7 6c0 1.5 2.5 2 5 2zM12 8c1.5-4 5-4.5 5-2 0 1.5-2.5 2-5 2z",
  beauty: circle(6.5, 6.5, 2.75) + circle(6.5, 17.5, 2.75) + "M8.6 8.3L20 18.5M8.6 15.7L20 5.5",
  repairs:
    "M14.5 3.6a5 5 0 0 0-3.6 6.8L3.9 17.4a1.9 1.9 0 0 0 2.7 2.7l7-7a5 5 0 0 0 6.8-3.6L17.5 12l-3-.5-.5-3z",
  bills:
    "M5.5 3.5h13v17l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5-2.1-1.5-2.2 1.5zM14 8.5h-3a1.25 1.25 0 0 0 0 2.5h2a1.25 1.25 0 0 1 0 2.5h-3M12 7.5v1M12 14v1",
  card: rect(2.5, 5.5, 19, 13, 2.5) + "M2.5 10h19M6.5 14.5h4",
  salary: rect(3, 7.5, 18, 12.5, 2.5) + "M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3 13h18",
  savings:
    "M3.5 7.5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5S13.6 5 10 5 3.5 6.1 3.5 7.5zM3.5 7.5v4c0 1.4 2.9 2.5 6.5 2.5M3.5 11.5v4c0 1.4 2.9 2.5 6.5 2.5" +
    circle(16.5, 15, 4.5),
  investments: "M3.5 17L9.5 11l4 4 7-7.5M15.5 7.5h5v5",
  leisure: "M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM14 7v10",
  transport: "M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v4H3zM6 17v2M18 17v2M3 13h18",
  other: tag,
} as const;

export type NavIconName = keyof typeof NAV_ICONS;
export type UiIconName = keyof typeof UI_ICONS;
export type CategoryIconName = keyof typeof CATEGORY_ICONS;
export type IconName = NavIconName | UiIconName | CategoryIconName;

/** Navigation icons carry a filled twin for the selected tab. */
export function hasFilledTwin(name: IconName): name is NavIconName {
  return Object.hasOwn(NAV_ICONS, name);
}

const isUiIcon = (name: IconName): name is UiIconName => Object.hasOwn(UI_ICONS, name);

export function iconPath(name: IconName, filled: boolean): string {
  if (hasFilledTwin(name)) return filled ? NAV_ICONS[name].filled : NAV_ICONS[name].outline;
  if (isUiIcon(name)) return UI_ICONS[name];
  return CATEGORY_ICONS[name];
}
