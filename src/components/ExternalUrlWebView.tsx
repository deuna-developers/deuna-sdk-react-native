import { useEffect, useRef, useState } from 'react';
import { DeunaSDK } from '../DeunaSDK';
import { Modal, SafeAreaView, StyleSheet } from 'react-native';
import { DeunaWebView } from './DeunaWebView';

interface ExternalUrlWebViewProps {
  instance: DeunaSDK;
}

export const ExternalUrlWebView = (props: ExternalUrlWebViewProps) => {
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
      const isVisible = !!ref.externalUrlHelper.externalUrlWebViewController;
      setVisible(isVisible);
    };

    instanceRef.current.addListener(listener);

    return () => {
      ref.removeListener(listener);
      ref.externalUrlHelper.externalUrlWebViewController?.dispose();
    };
  }, []);

  const externalUrlWebViewController =
    instanceRef.current.externalUrlHelper.externalUrlWebViewController;

  return (
    <>
      {visible && (
        <Modal
          presentationStyle="pageSheet"
          animationType="slide"
          onRequestClose={instanceRef.current.onCloseExternalUrl}
        >
          <SafeAreaView style={styles.container}>
            <DeunaWebView
              url={externalUrlWebViewController?.url ?? ''}
              onWebView={externalUrlWebViewController?.setWebView}
              onMessage={externalUrlWebViewController?.onMessage}
              onLoad={externalUrlWebViewController?.onLoad}
              onError={externalUrlWebViewController?.onError}
              onShouldStartLoadWithRequest={
                externalUrlWebViewController?.onShouldStartLoadWithRequest
              }
            />
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({ container: { flex: 1 } });
