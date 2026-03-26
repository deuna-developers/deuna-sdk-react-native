# @deuna/react-native-sdk

React Native SDK

## 🚨 Important: Breaking Changes in v2.0.0

**If you're upgrading from v1.x to v2.x**, please review the [CHANGELOG.md](./CHANGELOG.md) carefully. This major version includes breaking changes related to external URL handling and the removal of `expo-web-browser` dependency.

**Key changes:**
- New adapter pattern for browser functionality
- MercadoPago wallet and similar payments may require additional configuration
- Better Metro and Webpack compatibility

👉 **[Read the full migration guide in CHANGELOG.md](./CHANGELOG.md)**

## Usage

For detailed installation and usage instructions, please refer to our official documentation at [DEUNA React Native SDK Documentation](https://docs.deuna.com/reference/react-native-sdk).



### Running Example Apps

1. Install dependencies:
```bash
yarn install
```

2. Expo example app:

For iOS simulator:
```bash
yarn example:expo:ios
```

For iPhone real device:
```bash
yarn example:expo:ios:device
```

For Android:
```bash
yarn example:expo:android
```

3. React Native CLI example app:

Start Metro:
```bash
yarn example:cli:start
```

Run iOS:
```bash
yarn example:cli:ios
```

Run Android:
```bash
yarn example:cli:android
```

Both example apps are located under `examples/` and consume the SDK source code directly via Yarn workspaces.


## License

MIT

---
