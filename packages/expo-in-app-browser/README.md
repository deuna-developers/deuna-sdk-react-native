# @deuna/expo-in-app-browser

React Native In-App Browser adapter for DEUNA using Expo Web Browser.

## Installation

```bash
npm install @deuna/expo-in-app-browser
npm install expo-web-browser
# or
yarn add @deuna/expo-in-app-browser
yarn add expo-web-browser
```

## Usage

```tsx
import { ExpoWebBrowserAdapter } from '@deuna/expo-in-app-browser';

const browser = new ExpoWebBrowserAdapter();

// Open a URL in the in-app browser
await browser.openUrl('https://example.com');
```

## API

### `ExpoWebBrowserAdapter`

A class that implements the `InAppBrowserAdapter` interface.

#### Methods

| Method                                | Description                                  |
| ------------------------------------- | -------------------------------------------- |
| `openUrl(url: string): Promise<void>` | Opens the specified URL in an in-app browser |

### `InAppBrowserAdapter` Interface

```typescript
interface InAppBrowserAdapter {
  openUrl(url: string): Promise<void>;
}
```

## License

MIT
