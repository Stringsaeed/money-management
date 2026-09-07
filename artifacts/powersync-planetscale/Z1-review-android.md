# Z1 Android smoke receipt

Result: PASS

- Head: `a0006271c12653f2fd8277bd3ec22f0c8a4882f5`
- Branch: `feat/z1-op-sqlite`
- AVD: `Pixel_10a`
- Serial: `emulator-5554`
- Android: 17, API 37
- Page size: 16384 bytes
- Package/activity: `com.stringsaeed.moneymanagement/.MainActivity`
- Version: `1.0.0` (`versionCode=1`, `targetSdk=36`)
- Metro: `packager-status:running` on host port 8081 with `adb reverse`

## Build and install

- Generated the ignored `apps/mobile/android/` project from the current head.
- Local Gradle build: `BUILD SUCCESSFUL in 3m 19s`, 689 tasks.
- Installed `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` (115 MB).
- APK SHA-256: `6eec048b3761817ad8989eec2d1638ed1892229e23d119837b405ee7754d6d71`.
- Expo's configured EAS build cache uploaded the build as `c86a8360-60d4-4778-8498-fbc58af6cdd3`.

The first command used the ADB serial as Expo's `--device` value and stopped before Gradle because Expo expected the AVD name. The second attempt used `Pixel_10a`, built, installed, and launched successfully.

## User-visible proof

On a fresh device, completed first-account onboarding with a local account named `Android Checking`. The first `Open Trove` reproduced the known empty-query-cache bounce to onboarding. Relaunching the installed package loaded Home from the persisted op-sqlite database.

The final accessibility snapshot contained:

- `$0.00`
- `Upcoming payments`
- `Recent Journal`
- `Ledger`, `Inbox`, `Envelopes`, and `Settings`
- `Create transaction`

Screenshot: `Z1-review-android.png` (1080x2424, 171 KB)

Screenshot SHA-256: `719252207cc2c08a794b75bc395efe3421daf0ed9c6da438f3d7ec8b7ae57eca`

## Environment repair

The installed Android 37.1 16 KB system image was incomplete (22 MB, missing `ramdisk.img`, `system.img`, and `vendor.img`), causing `No initial system image for this configuration`. Android CLI updated the exact image from revision 8.0.0 to 9.0.0 without wiping the AVD. The repaired image booted normally.
