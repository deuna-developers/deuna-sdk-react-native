# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0-rc.2] - 2025-12-30

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

#### Option A: Using expo-web-browser (Recommended for Expo projects)

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

#### Option B: Using react-native-inappbrowser-reborn (Recommended for projects that use webpack)

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
