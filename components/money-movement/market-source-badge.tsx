import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";

export function MarketSourceBadge() {
  return (
    <Badge variant="secondary" className="border-transparent bg-sage/15">
      <Text className="text-sage">Twelve Data + FreeCryptoAPI</Text>
    </Badge>
  );
}
