import { Modal, SafeAreaView, StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { DeunaSDK } from '../DeunaSDK';
import { DeunaWebView } from './DeunaWebView';
import { Mode } from '../interfaces/types';
import { DeviceFingerprintWebView } from './DeviceFingerprintWebView';
import { ExternalUrlWebView } from './ExternalUrlWebView';

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
  const [isVisible, setIsVisible] = useState(
    instanceRef.current.deunaWidgetManager.isInitialized
  );

  useEffect(() => {
    instanceRef.current = instance;
  }, [instance]);

  // Listen when the DeunaSDK instance configuration
  // has changed
  useEffect(() => {
    const listener = () => {
      setIsVisible(instanceRef.current.deunaWidgetManager.isInitialized);
    };

    instanceRef.current.addListener(listener);

    return () => {
      instanceRef.current.removeListener(listener);
      if (instanceRef.current.deunaWidgetManager.isInitialized) {
        instanceRef.current.deunaWidgetManager.controller?.dispose();
      }
    };
  }, []);

  /**
   * This function is used to close the widget
   */
  const onClose = () => {
    const controller = instanceRef.current.deunaWidgetManager.controller;
    controller.closedAction = 'userAction';
    instanceRef.current.close();
  };

  // render the widget if mode is not null
  const viewManager = instanceRef.current.deunaWidgetManager;
  const controller = viewManager.isInitialized ? viewManager.controller : null;

  const isModal = isVisible && viewManager.mode === Mode.MODAL;
  const isEmbedded = isVisible && viewManager.mode === Mode.EMBEDDED;

  return (
    <>
      {isModal && (
        <Modal
          presentationStyle="pageSheet"
          animationType="slide"
          onRequestClose={onClose}
        >
          <SafeAreaView style={styles.container}>
            <View style={styles.container}>
              <DeunaWebView
                url={controller?.url ?? ''}
                onWebView={controller?.setWebView}
                onMessage={controller?.onMessage}
                onLoad={controller?.onLoad}
                onError={controller?.onError}
                onShouldStartLoadWithRequest={
                  controller?.onShouldStartLoadWithRequest
                }
              />
              <ExternalUrlWebView instance={instanceRef.current} />
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {isEmbedded && <ExternalUrlWebView instance={instanceRef.current} />}

      {isEmbedded && (
        <DeunaWebView
          url={controller?.url ?? ''}
          onWebView={controller?.setWebView}
          onMessage={controller?.onMessage}
          onLoad={controller?.onLoad}
          onError={controller?.onError}
          onShouldStartLoadWithRequest={
            controller?.onShouldStartLoadWithRequest
          }
        />
      )}

      <DeviceFingerprintWebView instance={instanceRef.current} />
    </>
  );
};

const styles = StyleSheet.create({ container: { flex: 1 } });
