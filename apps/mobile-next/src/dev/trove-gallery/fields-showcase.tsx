import { useState } from "react";

import { AmountInput, SearchField, TextField } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { GALLERY_CURRENCY, QUICK_PICKS } from "./sample-data";

export function FieldsShowcase() {
  const [name, setName] = useState("Everyday");
  const [empty, setEmpty] = useState("");
  const [disabledValue, setDisabledValue] = useState("Fresh Market");
  const [amount, setAmount] = useState("");
  const [query, setQuery] = useState("");

  return (
    <>
      <GalleryGroup label="TEXT FIELD · DEFAULT (TAP TO FOCUS)">
        <TextField label="Account name" onChangeText={setName} value={name} />
      </GalleryGroup>
      <GalleryGroup label="TEXT FIELD · ERROR">
        <TextField
          error="Enter a name so you can find this account later."
          label="Account name"
          onChangeText={setEmpty}
          value={empty}
        />
      </GalleryGroup>
      <GalleryGroup label="TEXT FIELD · DISABLED">
        <TextField
          disabled
          label="Merchant"
          onChangeText={setDisabledValue}
          value={disabledValue}
        />
      </GalleryGroup>
      <GalleryGroup label="AMOUNT INPUT · QUICK PICKS">
        <AmountInput
          currency={GALLERY_CURRENCY}
          label="Move to Emergency fund"
          onChangeText={setAmount}
          quickPicks={QUICK_PICKS}
          value={amount}
        />
      </GalleryGroup>
      <GalleryGroup label="SEARCH FIELD">
        <SearchField onChangeText={setQuery} placeholder="Search transactions" value={query} />
      </GalleryGroup>
    </>
  );
}
