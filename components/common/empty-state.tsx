import { Text, View } from "react-native";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        gap: 12,
      }}
    >
      {icon ? <Text style={{ fontSize: 48 }}>{icon}</Text> : null}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          textAlign: "center",
          color: "#374151",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          textAlign: "center",
          color: "#6B7280",
          lineHeight: 20,
        }}
      >
        {message}
      </Text>
      {action}
    </View>
  );
}
