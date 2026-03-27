export class DeunaLogs {
  static enable = true;

  static info(tag: string, message: any) {
    if (!DeunaLogs.enable) {
      return;
    }
    console.info(`✅ DeunaSDK: ${tag}`, message);
  }

  static error(tag: string, message: any) {
    if (!DeunaLogs.enable) {
      return;
    }
    console.error(`❌ DeunaSDK: ${tag}`, message);
  }
}
