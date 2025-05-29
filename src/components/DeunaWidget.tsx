import { Modal, SafeAreaView, StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { DeunaSDK } from '../DeunaSDK';
import { DeunaWebView } from './DeunaWebView';
import { NewTabWebView } from './NewTabWebView';
import { DeunaWebViewController } from '../controllers/BaseWebViewController';
import { Mode } from '../interfaces/types';
import { DeviceFingerprintWebView } from './DeviceFingerprintWebView';

interface DeunaWidgetProps {
  instance: DeunaSDK;
}

export const DeunaWidget = (props: DeunaWidgetProps) => {
  const { instance } = props;
  const instanceRef = useRef(instance);
  const [showPaymentStrategy, setShowPaymentStrategy] = useState(false);

  useEffect(() => {
    instanceRef.current = instance;
  }, [instance]);

  useEffect(() => {
    const listener = () => {
      setShowPaymentStrategy(instanceRef.current.submitStrategy !== null);
    };

    instanceRef.current.addListener(listener);

    return () => {
      instanceRef.current.removeListener(listener);
    };
  }, []);

  return (
    <>
      <DeunaWidgetContainer
        key="MainDeunaWidget"
        instance={instanceRef.current}
      />
      {showPaymentStrategy && (
        <DeunaWidgetContainer
          key="PaymentStrategy"
          instance={instanceRef.current.submitStrategy!.deunaSDK}
        />
      )}
    </>
  );
};

const DeunaWidgetContainer = (props: DeunaWidgetProps) => {
  const { instance } = props;
  const instanceRef = useRef(instance);
  const [mode, setMode] = useState<Mode | null>(instance.mode);

  useEffect(() => {
    instanceRef.current = instance;
  }, [instance]);

  // Listen when the DeunaSDK instance configuration
  // has changed
  useEffect(() => {
    const listener = () => {
      setMode(instanceRef.current.mode);
    };

    instanceRef.current.addListener(listener);

    return () => {
      instanceRef.current.removeListener(listener);
      instanceRef.current.webViewController?.dispose();
    };
  }, []);

  const isModal = mode === Mode.MODAL;
  const isEmbedded = mode === Mode.EMBEDDED;

  /**
   * This function is used to close the widget
   */
  const onClose = () => {
    const controller = instanceRef.current
      .webViewController as DeunaWebViewController;
    controller.closedAction = 'userAction';
    instanceRef.current.close();
  };

  // render the widget if mode is not null
  return (
    <>
      <Modal
        presentationStyle="pageSheet"
        animationType="slide"
        onRequestClose={onClose}
        onDismiss={instanceRef.current.onModalDismissed}
        visible={isModal}
      >
        {isModal && (
          <SafeAreaView style={styles.container}>
            <View style={styles.container}>
              <DeunaWebView
                url={instanceRef.current.webViewController?.url ?? ''}
                onWebView={instanceRef.current.webViewController?.setWebView}
                onMessage={instanceRef.current.webViewController?.onMessage}
                onLoad={instanceRef.current.webViewController?.onLoad}
                onError={instanceRef.current.webViewController?.onError}
                onShouldStartLoadWithRequest={
                  instanceRef.current.webViewController
                    ?.onShouldStartLoadWithRequest
                }
              />
              <NewTabWebView instance={instanceRef.current} />
            </View>
          </SafeAreaView>
        )}
      </Modal>

      {isEmbedded && <NewTabWebView instance={instanceRef.current} />}

      {isEmbedded && (
        <DeunaWebView
          url={instanceRef.current.webViewController?.url ?? ''}
          onWebView={instanceRef.current.webViewController?.setWebView}
          onMessage={instanceRef.current.webViewController?.onMessage}
          onLoad={instanceRef.current.webViewController?.onLoad}
          onError={instanceRef.current.webViewController?.onError}
          onShouldStartLoadWithRequest={
            instanceRef.current.webViewController?.onShouldStartLoadWithRequest
          }
        />
      )}
      <DeviceFingerprintWebView instance={instanceRef.current} />
    </>
  );
};

const styles = StyleSheet.create({ container: { flex: 1 } });
