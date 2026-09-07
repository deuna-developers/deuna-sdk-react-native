const { withAndroidManifest } = require('expo/config-plugins');

function withAndroidSingleTask(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];

    if (!mainApplication?.activity) {
      return config;
    }

    const mainActivity = mainApplication.activity.find(
      (activity) => activity.$['android:name'] === '.MainActivity'
    );

    if (mainActivity) {
      mainActivity.$['android:launchMode'] = 'singleTask';
    }

    return config;
  });
}

module.exports = withAndroidSingleTask;
