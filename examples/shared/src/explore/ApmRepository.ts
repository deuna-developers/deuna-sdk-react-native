import { ApmOption } from './domain';

const APM_CONFIG_URL =
  'https://gist.githubusercontent.com/darwinmorocho-deuna/16d9c3b60cae611bb0027fe82e4b9bcb/raw/mobile_apms_config.json';

export async function fetchApmOptions(): Promise<ApmOption[]> {
  const response = await fetch(APM_CONFIG_URL);
  if (!response.ok) {
    throw new Error(`ApmRepository: HTTP ${response.status}`);
  }

  const data: ApmOption[] = await response.json();

  // Filter to iOS-compatible entries (since this runs on iOS too)
  return data.filter((apm) => apm.iosCompatible === true);
}
