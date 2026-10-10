import { addDays, format } from "date-fns";
import { useState } from "react";

import { Button, TextField } from "@/ui/trove";
import {
  DateSheet,
  KeyboardDoneBarToolbar,
  RepeatOptions,
  Slider,
  type RepeatRule,
} from "@/ui/trove/pickers";

import { GalleryGroup } from "./gallery-group";
import { GallerySection } from "./gallery-section";

const todayKey = () => format(new Date(), "yyyy-MM-dd");
const noop = () => undefined;

export function GapsPickersSection() {
  const [date, setDate] = useState(todayKey);
  const [repeat, setRepeat] = useState<RepeatRule>("monthly");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [volume, setVolume] = useState(0.6);

  return (
    <GallerySection stamp="GAPS · PICKERS & FORMS" title="Pickers and forms">
      <GalleryGroup label="DATE SHEET · NATIVE CALENDAR INSIDE">
        <Button
          fullWidth
          label={`Date: ${date} · open sheet`}
          onPress={() => setSheetOpen(true)}
          variant="secondary"
        />
        <DateSheet
          onChange={setDate}
          onDismiss={() => setSheetOpen(false)}
          onRepeatChange={setRepeat}
          open={sheetOpen}
          repeat={repeat}
          value={date}
        />
      </GalleryGroup>
      <GalleryGroup label="REPEAT OPTIONS">
        <RepeatOptions date={date} onChange={setRepeat} value={repeat} />
        <Button
          label="Move date forward a day"
          onPress={() => setDate(format(addDays(new Date(`${date}T12:00:00`), 1), "yyyy-MM-dd"))}
          size="sm"
          variant="tertiary"
        />
      </GalleryGroup>
      <GalleryGroup label="KEYBOARD DONE BAR · EMAIL (TAP TO FOCUS, IOS)">
        <TextField
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          onNextField={noop}
          placeholder="you@example.com"
          value={email}
        />
        <TextField
          keyboardType="number-pad"
          label="PIN"
          onChangeText={setPin}
          onNextField={noop}
          onPreviousField={noop}
          value={pin}
        />
      </GalleryGroup>
      <GalleryGroup label="KEYBOARD DONE BAR · TOOLBAR">
        <KeyboardDoneBarToolbar onDone={noop} onNext={noop} onPrevious={noop} />
      </GalleryGroup>
      <GalleryGroup label="SLIDER · SETTINGS VOLUME">
        <Slider
          accessibilityLabel="Sound effects volume"
          adornment="volume"
          label="Sound effects"
          onValueChange={setVolume}
          value={volume}
        />
      </GalleryGroup>
      <GalleryGroup label="SLIDER · DISABLED">
        <Slider
          accessibilityLabel="Notification volume"
          adornment="volume"
          disabled
          label="Notifications"
          onValueChange={noop}
          value={0.3}
        />
      </GalleryGroup>
    </GallerySection>
  );
}
