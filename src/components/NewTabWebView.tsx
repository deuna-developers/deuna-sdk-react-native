import { useEffect, useRef, useState } from 'react';
import { DeunaSDK } from '../DeunaSDK';
import { Modal, SafeAreaView, StyleSheet } from 'react-native';
import { DeunaWebView } from './DeunaWebView';

interface NewTabWebViewProps {
  instance: DeunaSDK;
}

export const NewTabWebView = (props: NewTabWebViewProps) => {
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
      const isVisible = !!ref.newTabWebViewController;
      setVisible(isVisible);
    };

    instanceRef.current.addListener(listener);

    return () => {
      ref.removeListener(listener);
      ref.newTabWebViewController?.dispose();
    };
  }, []);

  const newTabController = instanceRef.current.newTabWebViewController;

  return (
    <Modal
      presentationStyle="pageSheet"
      visible={visible}
      animationType="slide"
      onRequestClose={instanceRef.current.onCloseNewTab}
      onDismiss={instanceRef.current.onNewTabDismissed}
    >
      {visible && (
        <SafeAreaView style={styles.container}>
          <DeunaWebView
            url={newTabController?.url ?? ''}
            onWebView={newTabController?.setWebView}
            onMessage={newTabController?.onMessage}
            onLoad={newTabController?.onLoad}
            onError={newTabController?.onError}
            onShouldStartLoadWithRequest={
              newTabController?.onShouldStartLoadWithRequest
            }
          />
        </SafeAreaView>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({ container: { flex: 1 } });
