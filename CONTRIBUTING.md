## Development workflow

**IMPORTANT:**
Use `yarn` instead of `npm` to install, and run the package scripts.


### Local development

IMPORTANT:
Node version 20 is required before run any yarn command.
Use nvm to manage node versions.
```shell
nvm install 20
nvm use 20
```


1. Install dependencies for examples.

Run the next command in root folder.
```shell
yarn example:expo:install
```

The above command installs dependencies for the Expo example workspace.

3. Run the Expo example project from root folder.
```shell
yarn example:expo:ios
```
Or
```shell
yarn example:expo:android
```
The above commands run the Expo example app.

4. Run the React Native CLI example project.

Prerequisites:
- Xcode + CocoaPods for iOS
- Android Studio + Android SDK for Android

Install dependencies:
```shell
yarn example:cli:install
```

Start Metro:
```shell
yarn example:cli:start
```

Run iOS:
```shell
yarn example:cli:ios
```

Run Android:
```shell
yarn example:cli:android
```
