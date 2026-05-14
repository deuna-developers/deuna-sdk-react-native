import MainApp from './screens/Main/MainApp';
import { InAppBrowserAdapter } from '@deuna/react-native-sdk';
import type { StorageAdapter } from './explore/domain';

interface SharedAppProps {
  runtimeLabel?: string;
  inAppBrowserAdapter?: InAppBrowserAdapter;
  storageAdapter?: StorageAdapter;
}

const App = ({
  runtimeLabel = 'Unknown',
  inAppBrowserAdapter,
  storageAdapter,
}: SharedAppProps) => {
  return (
    <MainApp
      runtimeLabel={runtimeLabel}
      inAppBrowserAdapter={inAppBrowserAdapter}
      storageAdapter={storageAdapter}
    />
  );
};

export default App;
