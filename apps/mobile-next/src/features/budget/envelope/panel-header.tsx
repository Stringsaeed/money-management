import { Header } from "@/ui/trove";

interface PanelHeaderProps {
  readonly title: string;
  readonly onBack: () => void;
}

/** Title of one ••• panel with a way back to the menu. */
export function PanelHeader({ title, onBack }: PanelHeaderProps) {
  return <Header variant="compact" title={title} onBack={onBack} />;
}
