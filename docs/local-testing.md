# Local Testing (without publishing native SDKs)

The RN native module (`DeunaWalletsModule`) depends on:
- **iOS**: `DeunaSDK` CocoaPod
- **Android**: `deunasdk` JitPack artifact

This guide explains how to run the example app against local checkouts of those SDKs before publishing new versions.

## Prerequisites

- Monorepo layout assumed:
  ```
  deuna/
  ├── deuna-sdk-ios/
  ├── deuna-sdk-android/
  └── deuna-sdk-react-native/
  ```
- Yarn installed at the repo root (`yarn install`)
- Xcode + CocoaPods for iOS
- Android Studio + JDK for Android

---

## iOS

The example app's [`withLocalPods.js`](../examples/expo/plugins/withLocalPods.js) config plugin automatically injects local path overrides during `expo prebuild`:

```ruby
pod 'DeunaWalletsModule', :path => '../../../'
pod 'DeunaSDK',           :path => '../../../../deuna-sdk-ios'
```

No manual Podfile edits needed.

### Steps

```bash
# 1. Install JS dependencies (once)
yarn install

# 2. Generate native project with local pod paths
yarn example:expo:prebuild
# or: cd examples/expo && npx expo prebuild --platform ios

# 3. Install pods
cd examples/expo/ios && pod install && cd ../../..

# 4. Run on simulator
yarn example:expo:ios

# Run on a real device (shows a picker)
yarn example:expo:ios:device
```

### After changing the iOS SDK

Re-run `pod install` — no prebuild needed unless `app.json` changed:

```bash
cd examples/expo/ios && pod install
```

---

## Android

Gradle resolves `deunasdk` from JitPack. For local changes not yet pushed/published, publish to your local Maven repository first.

### Steps

```bash
# 1. Publish Android SDK to local Maven (~/.m2)
cd deuna-sdk-android
./gradlew sdk:publishToMavenLocal
cd ..
```

> **Verify the artifact:** check that `~/.m2/repository/com/deuna/` contains the published files.  
> Note the `groupId:artifactId:version` (e.g. `com.deuna.maven:sdk:2.x.x`) printed at the end of the Gradle task.

```bash
# 2. Update the dependency in android/build.gradle of the RN module
#    Change:
#      implementation 'com.github.deuna-developers:deunasdk:+'
#    To (use the version from step 1):
#      implementation 'com.deuna.maven:sdk:2.x.x'
```

The example app's `android/build.gradle` already includes `mavenLocal()` in its repositories block, so Gradle will find the locally published artifact.

```bash
# 3. Run
yarn example:expo:android
```

### After changing the Android SDK

Repeat step 1 (`publishToMavenLocal`) and rebuild:

```bash
cd deuna-sdk-android && ./gradlew sdk:publishToMavenLocal && cd ..
yarn example:expo:android
```

### Reverting to JitPack (published version)

Restore `android/build.gradle`:
```gradle
implementation 'com.github.deuna-developers:deunasdk:+'
```

---

## SPM vs CocoaPods

Some iOS apps use Swift Package Manager alongside CocoaPods — this does **not** conflict with our module:

| | CocoaPods | SPM |
|---|---|---|
| `DeunaWalletsModule` | ✅ via `.podspec` | not supported yet |
| `DeunaSDK` (iOS) | ✅ via `DeunaSDK.podspec` | ✅ via `Package.swift` |

CocoaPods and SPM operate independently in Xcode. A consumer app can use SPM for some dependencies and CocoaPods for others without issues.

**Potential conflict (edge case):** if a consumer app already has `DeunaSDK` linked via SPM and also installs `DeunaWalletsModule` via CocoaPods (which brings `DeunaSDK` as a pod), the linker may see duplicate symbols. This is uncommon in practice — React Native apps overwhelmingly use CocoaPods, not SPM, for native modules.

---

## Full clean rebuild

If you hit stale build artifacts:

```bash
# iOS
cd examples/expo
rm -rf ios android
npx expo prebuild
cd ios && pod install && cd ..

# Android — clear Gradle cache
cd examples/expo/android
./gradlew clean
```
