#!/usr/bin/env node
/**
 * CocoaPods only evaluates ExpoSQLite.podspec's vendor_sqlite_src! during
 * `pod install`. stim / xcodebuild can compile the ios/ tree before that copy
 * runs, leaving sqlite3.c/h missing. Mirror the podspec copy into ios/ after
 * install so native builds always see the vendored sources.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

let expoSqliteRoot;
try {
  expoSqliteRoot = dirname(require.resolve("expo-sqlite/package.json"));
} catch {
  // Mobile workspace not installed in this environment — nothing to do.
  process.exit(0);
}

const files = ["sqlite3.c", "sqlite3.h"];
const vendorDir = join(expoSqliteRoot, "vendor", "sqlite3");
const iosDir = join(expoSqliteRoot, "ios");

if (!existsSync(join(vendorDir, "sqlite3.c"))) {
  console.warn(
    "[ensure-expo-sqlite-ios-vendor] vendor/sqlite3/sqlite3.c missing; skip",
  );
  process.exit(0);
}

mkdirSync(iosDir, { recursive: true });

for (const file of files) {
  const source = join(vendorDir, file);
  const destination = join(iosDir, file);
  if (!existsSync(source)) {
    console.warn(`[ensure-expo-sqlite-ios-vendor] missing ${source}; skip`);
    process.exit(0);
  }
  copyFileSync(source, destination);
}

console.log(
  "[ensure-expo-sqlite-ios-vendor] synced vendor/sqlite3 → ios/sqlite3.{c,h}",
);
