import {
  BookOpenIcon,
  ChartLineUpIcon,
  EnvelopeIcon,
  GearSixIcon,
  HouseIcon,
  TrayIcon,
  type Icon as PhosphorIcon,
} from "phosphor-react-native";

const TAB_ICONS: Record<string, PhosphorIcon> = {
  "(home)": HouseIcon,
  ledger: BookOpenIcon,
  "money-movement": ChartLineUpIcon,
  inbox: TrayIcon,
  envelopes: EnvelopeIcon,
  settings: GearSixIcon,
};

export const getTabIcon = (routeName: string) => TAB_ICONS[routeName];

export const hasTabIcon = (routeName: string) => Object.hasOwn(TAB_ICONS, routeName);
