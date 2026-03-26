import MainApp from './screens/Main/MainApp';
import { InAppBrowserAdapter } from '@deuna/react-native-sdk';

interface SharedAppProps {
  runtimeLabel?: string;
  inAppBrowserAdapter?: InAppBrowserAdapter;
}

const App = ({
  runtimeLabel = 'Unknown',
  inAppBrowserAdapter,
}: SharedAppProps) => {
  return (
    <MainApp
      runtimeLabel={runtimeLabel}
      inAppBrowserAdapter={inAppBrowserAdapter}
    />
  );
};

export default App;
