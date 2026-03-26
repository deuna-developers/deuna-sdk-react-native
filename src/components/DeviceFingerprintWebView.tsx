import { useEffect, useRef, useState } from 'react';
import { DeunaSDK } from '../DeunaSDK';
import { DeunaWebView } from './DeunaWebView';
import { View } from 'react-native';

interface DeviceFingerprintWebViewProps {
  instance: DeunaSDK;
}

export const DeviceFingerprintWebView = (
  props: DeviceFingerprintWebViewProps
) => {
  const { instance } = props;
  const instanceRef = useRef<DeunaSDK>(instance);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    instanceRef.current = instance;
  }, [instance]);

  // Listen when the DeunaSDK instance configuration
  // has changed
  useEffect(() => {
    const ref = instanceRef.current;
    const listener = () => {
      const isVisible = !!ref.deviceFingerprintController;
      setVisible(isVisible);
    };

    instanceRef.current.addListener(listener);

    return () => {
      ref.removeListener(listener);
    };
  }, []);

  const deviceFingerprintController =
    instanceRef.current.deviceFingerprintController;

  return (
    <>
      {visible && (
        <View>
          <DeunaWebView
            url={deviceFingerprintController?.url ?? ''}
            onWebView={deviceFingerprintController?.setWebView}
            onMessage={deviceFingerprintController?.onMessage}
            onLoad={deviceFingerprintController?.onLoad}
            onError={deviceFingerprintController?.onError}
            onShouldStartLoadWithRequest={
              deviceFingerprintController?.onShouldStartLoadWithRequest
            }
          />
        </View>
      )}
    </>
  );
};
