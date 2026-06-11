import {
  BookOpenIcon,
  ChartLineUpIcon,
  EnvelopeIcon,
  GearSixIcon,
  HouseIcon,
  type Icon as PhosphorIcon,
} from "phosphor-react-native";

const TAB_ICONS: Record<string, PhosphorIcon> = {
  index: HouseIcon,
  ledger: BookOpenIcon,
  "money-movement": ChartLineUpIcon,
  envelopes: EnvelopeIcon,
  settings: GearSixIcon,
};

export const getTabIcon = (routeName: string) => TAB_ICONS[routeName];

export const hasTabIcon = (routeName: string) => Object.hasOwn(TAB_ICONS, routeName);
