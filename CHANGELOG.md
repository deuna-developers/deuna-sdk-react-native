# Changelog

All notable changes to this project will be documented in this file.

## [2.1.x] - 2026-05-12

### 🚨 BREAKING CHANGE — Native Wallet Support (Google Pay & Apple Pay)

Version 2.1.0 introduces native Google Pay and Apple Pay support via a new native module (`DeunaWalletsModule`). This requires additional setup steps that **did not exist in previous versions**.

#### What's new

- `sdk.getWalletsAvailable()` — queries the vault API and filters by what the device actually supports natively.
- `sdk.initElements()` — launches the native Google Pay or Apple Pay payment sheet directly, without a WebView.

#### ⚠️ Breaking: installation steps changed

Previous versions only required installing the npm package. Version 2.1.0 ships a native iOS/Android module that must be linked.

**React Native CLI** — run `pod install` after upgrading:

```bash
npm install @deuna/react-native-sdk@2.1.0
cd ios && pod install
```

**Expo (managed workflow)** — re-run `prebuild` after upgrading:

```bash
npm install @deuna/react-native-sdk@2.1.0
npx expo prebuild
```

If you skip these steps, calling `getWalletsAvailable()` will always return `[]` and `initElements()` will throw.

#### ⚠️ iOS (React Native CLI only): Xcode 16+ / Clang 16+ build fix required

Clang 16+ (shipped with Xcode 16+) rejects `consteval` calls inside the `fmt` pod that React Native includes. Add the following to the `post_install` block in your `ios/Podfile`:

```ruby
post_install do |installer|
  react_native_post_install(installer, config[:reactNativePath], :mac_catalyst_enabled => false)

  # Fix: fmt consteval incompatibility with Xcode 16+ / Clang 16+
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      if target.name == 'fmt'
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
    end
  end
end
```

Re-run `pod install` after editing the Podfile.

**Expo users do not need this step** — the SDK's config plugin (`withDeunaWallets`) applies it automatically during `expo prebuild`.

#### ⚠️ Breaking: Apple Pay requires entitlement + merchant ID

Apple Pay will never be available unless the app's provisioning profile includes the `com.apple.developer.in-app-payments` entitlement with your merchant ID.

**Expo** — add to `app.json`:

```json
{
  "expo": {
    "ios": {
      "entitlements": {
        "com.apple.developer.in-app-payments": ["merchant.io.your-domain.com"]
      }
    }
  }
}
```

**React Native CLI** — add to `ios/<AppName>/<AppName>.entitlements`:

```xml
<key>com.apple.developer.in-app-payments</key>
<array>
  <string>merchant.io.your-domain.com</string>
</array>
```

#### ⚠️ Breaking: Google Pay requires merchant enrollment

`getWalletsAvailable()` will not return `google_pay` unless the merchant account has Google Pay enabled in the DEUNA dashboard. Calling with an API key from a merchant without Google Pay returns `[]`.

#### ⚠️ Android (React Native CLI only): dependency compatibility patch required

`deuna-sdk-android` transitively pulls `androidx.browser:1.10.0`, `kotlin-stdlib:2.1.x`, and `androidx.annotation:1.10.0`, which are incompatible with the AGP 8.6.0 / Kotlin 1.9.x build environment shipped with React Native 0.76.x.

Add the following block to your `android/app/build.gradle`:

```groovy
configurations.all {
    resolutionStrategy {
        force 'androidx.browser:browser:1.8.0'
        force 'org.jetbrains.kotlin:kotlin-stdlib:1.9.25'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.9.25'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.25'
        force 'androidx.annotation:annotation:1.8.2'
        force 'androidx.annotation:annotation-jvm:1.8.2'
    }
}
```

**Expo users do not need this step** — the SDK's config plugin (`withDeunaWallets`) applies it automatically during `expo prebuild`.

### Added

- `getWalletsAvailable(params)` — returns the list of native wallet providers available on the current device for the given order.
- `initElements(params)` — launches the native wallet payment sheet (Google Pay or Apple Pay) and handles tokenization.
- Native iOS module (`DeunaWalletsModule`) implemented as `RCTEventEmitter` — zero Podfile changes required, linked automatically via React Native autolinking.
- Native Android module (`DeunaWalletsModule`) implemented as `ReactContextBaseJavaModule` — zero Podfile/Gradle changes required, linked automatically via React Native autolinking.
- Expo config plugin (`withAndroidDepsCompat`) automatically patches `app/build.gradle` with the dependency compatibility block during `expo prebuild`.

### Fixed

- Android: `allowedCardNetworks` (and other array/object credential fields) were incorrectly cast to `String`, causing a crash when launching Google Pay. Credentials are now recursively converted preserving arrays, nested objects, booleans, and numbers.
- Android: `ObjectAlreadyConsumedException: Map already consumed` crash on Google Pay success — `WritableMap` was passed to both `sendEvent` and `promise.resolve`, consuming it twice. Each call now gets its own independent conversion.
- iOS: Removed redundant conditional cast warning (`conditional cast from '[String: Any]' to '[String: Any]' always succeeds`) in success callback logging.

## [2.0.5] - 2026-04-28

### Fixed

- Fixed a race condition for InAppBrowser close listener that was causing the WebView to be closed before the external url was closed.

## [2.0.4] - 2026-03-26

### Fixed

- Improved iOS in-app browser close handling by marking the browser as closed after returning from `openUrl`.

### Changed

- Updated external URL opening logic to detect user-initiated actions and bypass the 5-second reopen guard for explicit manual clicks.

## [2.0.3] - 2026-03-26

### Fixed

- Fixed a Mercado Pago redirect regression where reopening the widget could block opening the same in-app browser URL again.
- Added a reset of the in-app browser reopen guard on each new widget initialization (`payment`, `elements`, `nextAction`, `voucher`) to allow valid retry flows.
- Kept a 5-second in-app browser reopen guard to prevent immediate redirect loops while preserving reopening behavior across widget sessions.
- Fixed iOS `WKWebView` warnings (`Error evaluating injectedJavaScript ... unsupported return type`) by making injected JavaScript snippets return a supported value (`true`).

## [2.0.2] - 2026-03-25

### Added

- Updated the web sdk types.

## [2.0.1] - 2026-02-19

### Added

- **Added fraud_id & user_agent to the order object in the onSuccess callback**

## [2.0.0] - 2026-01-02

### 🚨 BREAKING CHANGES

This is a **major version** release with breaking changes. Please read the migration guide carefully.

#### What's Breaking:

1. **Removed `expo-web-browser` dependency** - No longer included as a dependency. Some merchants uses webpack to bundle their apps and `expo-web-browser` is not compatible with webpack and we need to support it.
2. **New adapter pattern required** - Browser functionality now requires explicit adapter configuration
3. **API changes** - SDK initialization for merchants that uses Mercado Pago wallet require an adapter configuration to open the redirect url in a custom tab or safari view controller.

#### Impact:

- **External redirects still work** and open in WebView by default
- **Payments requiring Custom Tabs/Safari View Controller** (like Mercado Pago wallet) now need custom adapter configuration
- **In-app browser experience** with native Custom Tabs (Android) or Safari View Controller (iOS) now requires manual setup via adapters

### Added

- **New Adapter Pattern**: Introduced `InAppBrowserAdapter` interface for customizable browser behavior
- **DefaultInAppBrowserAdapter**: Default implementation using React Native's `Linking.openURL()`
- Exported adapter types and implementations from `src/adapters/index.ts`

---

## 📋 Migration Guide from 1.x to 2.0.0

### Scenario 1: Basic Usage (No Changes Needed)

If you don't use any payment method that cannot be rendered in a tradicional webView like Mercado Pago Wallet, no changes are required. Otherwise, you need to configure a custom adapter using the `InAppBrowserAdapter` interface.

### Scenario 2: Custom Tabs/Safari View Controller for Specific Payments

External redirects work by default and open in WebView. However, some payments (like **Mercado Pago wallet**) require opening in **Custom Tabs (Android)** or **Safari View Controller (iOS)** to function properly. For these cases, you need to configure a custom adapter.

#### Expo projects: Using expo-web-browser

**1. Install the dependency:**

```bash
npm install expo-web-browser
# or
yarn add expo-web-browser
```

**2. Create and use the adapter:**

```typescript
import { WebBrowser } from 'expo-web-browser';
import { InAppBrowserAdapter, DeunaSDK } from '@deuna/react-native-sdk';

class ExpoWebBrowserAdapter implements InAppBrowserAdapter {
  private initialized = false;

  private async initialize() {
    if (this.initialized) return;
    await WebBrowser.maybeCompleteAuthSession();
    this.initialized = true;
  }

  async openUrl(url: string): Promise<void> {
    try {
      await this.initialize();
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error('Error opening browser:', error);
      throw error;
    }
  }
}

// Initialize SDK with custom adapter
const deunaSDK = DeunaSDK.initialize({
  publicApiKey: 'your-public-api-key',
  environment: 'production',
  inAppBrowserAdapter: new ExpoWebBrowserAdapter(),
});
```

#### React Native CLI projects: Using react-native-inappbrowser-reborn

**1. Install the dependency:**

```bash
npm install react-native-inappbrowser-reborn
# or
yarn add react-native-inappbrowser-reborn
```

**2. Create and use the adapter:**

```typescript
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { InAppBrowserAdapter, DeunaSDK } from '@deuna/react-native-sdk';

class InAppBrowserRebornAdapter implements InAppBrowserAdapter {
  async openUrl(url: string): Promise<void> {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(url, {
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: '#453AA4',
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
        });
      } else {
        // Fallback to system browser
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening in-app browser:', error);
      throw error;
    }
  }
}

const deunaSDK = DeunaSDK.initialize({
  publicApiKey: 'your-public-api-key',
  environment: 'production',
  inAppBrowserAdapter: new InAppBrowserRebornAdapter(),
});
```

> Warning: Currently `react-native-inappbrowser-reborn` is not compatible with "Support 16 KB page sizes" feature of Android 15+ Recommendation. For more information, see [Android 15+ Recommendation](https://developer.android.com/guide/practices/page-sizes). And check [react-native-inappbrowser-reborn](https://github.com/proyecto26/react-native-inappbrowser/issues/483) for more information.

### Option C: Using a custom adapter (If you don't want to use expo-web-browser or react-native-inappbrowser-reborn)

You can also create your own adapter by implementing the `InAppBrowserAdapter` interface:

```typescript
import { InAppBrowserAdapter, DeunaSDK } from '@deuna/react-native-sdk';
import { Linking } from 'react-native';

class CustomBrowserAdapter implements InAppBrowserAdapter {
  async openUrl(url: string): Promise<void> {
    try {
      // Your custom logic here
      // Example: Add logging, analytics, or custom URL handling
      console.log('Opening URL:', url);

      // You could integrate with any browser library or custom WebView

      // Or implement your own WebView modal, etc.
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  }
}

const deunaSDK = DeunaSDK.initialize({
  publicApiKey: 'your-public-api-key',
  environment: 'production',
  inAppBrowserAdapter: new CustomBrowserAdapter(),
});
```

### Before vs After Comparison

**Before (v1.x):**

```typescript
// SDK handled browser opening automatically with expo-web-browser
const deunaSDK = DeunaSDK.initialize({
  publicApiKey: 'your-public-api-key',
  environment: 'production',
});
```

> In v1.x, the SDK automatically used `expo-web-browser` internally to open external URLs in Custom Tabs (Android) or Safari View Controller (iOS) when needed.

**After (v2.0.0):**

```typescript
// You control how external URLs are opened
const deunaSDK = DeunaSDK.initialize({
  publicApiKey: 'your-public-api-key',
  environment: 'production',
  inAppBrowserAdapter: new ExpoWebBrowserAdapter(), // Optional, uses default if not provided
});
```

### Why This Change?

- **Metro and Webpack compatibility**: Removed `expo-web-browser` dependency to ensure the SDK works seamlessly with both Metro (React Native) and Webpack bundlers.
- **Better flexibility**: Choose the browser implementation that works best for your app
- **Reduced bundle size**: Only include browser dependencies you actually need
- **Platform compatibility**: Works better with different React Native setups (Expo, bare React Native, etc.)
- **Build system compatibility**: Eliminates bundler conflicts that could occur with expo-web-browser in non-Expo environments
- **Future-proof**: Easier to adapt to new browser libraries or custom implementations
