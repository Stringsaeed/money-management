/**
 * TODO(#285): Delete this file after QA sign-off on the Text StyleSheet migration.
 *
 * This is a temporary dev-only gallery for visually verifying all Text variants
 * render correctly with the new StyleSheet + design-tokens implementation.
 *
 * Access via Stim: exp://localhost:8081/--/dev/text-gallery
 */

import { router } from "expo-router";
import { ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

function VariantSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text variant="muted">{label}</Text>
      {children}
    </View>
  );
}

function GalleryContent() {
  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="p-4 pb-safe-offset-12 gap-6"
    >
      {/* TODO(#285): Delete after QA */}
      <View className="rounded-lg bg-terracotta/20 p-3">
        <Text className="text-terracotta text-center">
          ⚠️ QA Gallery — Delete after #285 sign-off
        </Text>
      </View>

      <VariantSection label={'variant="default"'}>
        <Text variant="default">
          The quick brown fox jumps over the lazy dog. Default body text for general content.
        </Text>
      </VariantSection>

      <VariantSection label={'variant="h1"'}>
        <Text variant="h1">Heading Level 1</Text>
      </VariantSection>

      <VariantSection label={'variant="h2"'}>
        <Text variant="h2">Heading Level 2</Text>
      </VariantSection>

      <VariantSection label={'variant="h3"'}>
        <Text variant="h3">Heading Level 3</Text>
      </VariantSection>

      <VariantSection label={'variant="h4"'}>
        <Text variant="h4">Heading Level 4</Text>
      </VariantSection>

      <VariantSection label={'variant="p"'}>
        <Text variant="p">
          This is a paragraph variant. It has built-in top margin and adjusted line height for
          comfortable reading of longer text blocks.
        </Text>
      </VariantSection>

      <VariantSection label={'variant="blockquote"'}>
        <Text variant="blockquote">
          {'"Design is not just what it looks like and feels like. Design is how it works."'}
        </Text>
      </VariantSection>

      <VariantSection label={'variant="code"'}>
        <View className="flex-row flex-wrap gap-1">
          <Text>Use </Text>
          <Text variant="code">StyleSheet.create()</Text>
          <Text> instead of NativeWind.</Text>
        </View>
      </VariantSection>

      <VariantSection label={'variant="lead"'}>
        <Text variant="lead">
          Lead text is larger and uses muted foreground color for introductory content.
        </Text>
      </VariantSection>

      <VariantSection label={'variant="large"'}>
        <Text variant="large">Large variant for emphasized body text</Text>
      </VariantSection>

      <VariantSection label={'variant="small"'}>
        <Text variant="small">Small variant for captions, labels, and secondary info</Text>
      </VariantSection>

      <VariantSection label={'variant="muted"'}>
        <Text variant="muted">Muted text uses a subdued color for less prominent information.</Text>
      </VariantSection>

      {/* Light/dark note */}
      <View className="mt-4 rounded-lg bg-surface-container p-4 gap-2">
        <Text variant="large">🌓 Light/Dark Mode</Text>
        <Text variant="muted">
          Toggle appearance via Stim dev tools or device settings to verify colors adapt correctly.
        </Text>
      </View>
    </ScrollView>
  );
}

function NotAvailable() {
  return (
    <View className="flex-1 bg-surface items-center justify-center gap-4 p-6">
      <Text variant="h3">🚫 Dev Only</Text>
      <Text variant="muted" className="text-center">
        This gallery is only available in development builds.
      </Text>
      <Button variant="outline" onPress={() => router.back()}>
        <Text>Go Back</Text>
      </Button>
    </View>
  );
}

export default function TextGalleryScreen() {
  if (!__DEV__) {
    return <NotAvailable />;
  }

  return <GalleryContent />;
}
