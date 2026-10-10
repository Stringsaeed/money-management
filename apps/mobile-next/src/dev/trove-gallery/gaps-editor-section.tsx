import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { colors, Keypad, radius, space } from "@/ui/trove";
import {
  Breadcrumb,
  EditorHeader,
  EntryAmount,
  NoteField,
  OptionTile,
  OptionTileGrid,
  type BreadcrumbSegmentState,
} from "@/ui/trove/editor";

import { GalleryGroup } from "./gallery-group";
import { GallerySection } from "./gallery-section";

const noop = () => undefined;

const ACCOUNTS = [
  { id: "right", emoji: "🏦", name: "Right", subtitle: "AED · 12,480.50" },
  { id: "savings", emoji: "🐷", name: "Main Savings", subtitle: "EUR · 3,120.00" },
] as const;

const CATEGORIES = [
  { id: "groceries", emoji: "🛒", name: "Groceries" },
  { id: "dining", emoji: "🍽️", name: "Dining" },
  { id: "coffee", emoji: "☕", name: "Coffee" },
  { id: "transport", emoji: "🚕", name: "Transport" },
  { id: "bills", emoji: "🧾", name: "Bills" },
  { id: "suggest", emoji: "✨", name: "Suggest" },
] as const;

const AMOUNT_SAMPLES = [
  { label: "EMPTY", value: "", negative: false },
  { label: "TYPING · 64.2", value: "64.2", negative: false },
  { label: "EXPENSE · LEADING MINUS", value: "64.2", negative: true },
  { label: "AUTO-SHRINK · 34", value: "1250000", negative: false },
] as const;

const CURRENCY = "AED";

/** Mirrors the GapsEditor board: header, breadcrumb, option tiles, note, entry amount, number pad. */
export function GapsEditorSection() {
  const [account, setAccount] = useState<string>(ACCOUNTS[0].id);
  const [category, setCategory] = useState<string>(CATEGORIES[0].id);
  const [open, setOpen] = useState<"category" | null>("category");
  const [note, setNote] = useState("Weekly groceries");
  const [longNote, setLongNote] = useState(
    "Split with Sara and Omar. They owe 48.50 each — remind them after the weekend.",
  );
  const [entry, setEntry] = useState("64.2");

  const categoryState: BreadcrumbSegmentState = open === "category" ? "active" : "set";
  const accountName = ACCOUNTS.find((item) => item.id === account)?.name ?? "";
  const categoryName = CATEGORIES.find((item) => item.id === category)?.name ?? "";

  return (
    <GallerySection stamp="GAPS EDITOR · TRANSACTION EDITOR" title="Transaction editor">
      <GalleryGroup label="EDITOR HEADER · NEW / EDIT / INVALID">
        <EditorHeader onClose={noop} onSave={noop} title="New entry" />
        <EditorHeader onClose={noop} onDelete={noop} onSave={noop} title="Edit entry" />
        <EditorHeader onClose={noop} onSave={noop} saveDisabled title="New entry" />
      </GalleryGroup>

      <GalleryGroup label="BREADCRUMB · SET / ACTIVE / UNSET (TAP TO TOGGLE)">
        <Breadcrumb
          segments={[
            { key: "account", emoji: "🏦", label: accountName, state: "set" },
            {
              key: "category",
              emoji: "🛒",
              label: categoryName,
              state: categoryState,
              onPress: () => setOpen(open === "category" ? null : "category"),
            },
            { key: "when", emoji: "📅", label: "Today", state: "set" },
          ]}
        />
        <Breadcrumb
          segments={[
            { key: "account", emoji: "🏦", label: "Right", state: "set" },
            { key: "category", emoji: "🏷️", label: "Category", state: "unset" },
            { key: "when", emoji: "📅", label: "Today", state: "set" },
          ]}
        />
        <Breadcrumb
          accessibilityLabel="Kind"
          segments={[
            { key: "expense", emoji: "💸", label: "Expense", state: "active" },
            { key: "income", emoji: "💰", label: "Income", state: "set" },
            { key: "transfer", emoji: "🔁", label: "Transfer", state: "set" },
          ]}
          variant="toggle"
        />
      </GalleryGroup>

      <GalleryGroup label="OPTION TILES · LIST">
        <View accessibilityLabel="Account" accessibilityRole="radiogroup" style={styles.list}>
          {ACCOUNTS.map((item) => (
            <OptionTile
              emoji={item.emoji}
              key={item.id}
              name={item.name}
              onPress={() => setAccount(item.id)}
              selected={account === item.id}
              subtitle={item.subtitle}
            />
          ))}
        </View>
      </GalleryGroup>

      <GalleryGroup label="OPTION TILES · GRID">
        <OptionTileGrid accessibilityLabel="Category">
          {CATEGORIES.map((item) => (
            <OptionTile
              emoji={item.emoji}
              key={item.id}
              layout="grid"
              name={item.name}
              onPress={() => setCategory(item.id)}
              selected={category === item.id}
            />
          ))}
        </OptionTileGrid>
      </GalleryGroup>

      <GalleryGroup label="NOTE · EMPTY / FILLED">
        <NoteField onChangeText={noop} value="" />
        <NoteField onChangeText={setNote} value={note} />
      </GalleryGroup>

      <GalleryGroup label="NOTE · MULTILINE">
        <NoteField maxLength={280} multiline onChangeText={setLongNote} value={longNote} />
      </GalleryGroup>

      <GalleryGroup label="ENTRY AMOUNT · STATES">
        {AMOUNT_SAMPLES.map((sample) => (
          <View key={sample.label} style={styles.sample}>
            <EntryAmount currency={CURRENCY} negative={sample.negative} value={sample.value} />
          </View>
        ))}
      </GalleryGroup>

      <GalleryGroup label="NUMBER PAD · FILL · HOLD DELETE TO CLEAR">
        <View style={styles.pad}>
          <EntryAmount currency={CURRENCY} negative value={entry} />
          <View style={styles.keys}>
            <Keypad fill onChange={setEntry} value={entry} />
          </View>
        </View>
      </GalleryGroup>
    </GallerySection>
  );
}

const styles = StyleSheet.create({
  list: { gap: space[2] },
  sample: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: space[3],
  },
  pad: {
    borderColor: colors.border.subtle,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: space[3],
    height: 440,
    padding: space[3],
  },
  keys: { flex: 1 },
});
