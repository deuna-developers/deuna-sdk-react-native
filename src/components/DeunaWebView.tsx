import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';
import { WebViewLoader } from './WebViewLoader';

interface DeunaWebViewProps {
  url: string;
  onWebView?: (webView: WebView) => void;
  onMessage?: (event: any) => void;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onShouldStartLoadWithRequest?: (request: any) => boolean;
}

export const DeunaWebView = (props: DeunaWebViewProps) => {
  return (
    <View style={styles.container}>
      <WebView
        ref={(webView) => {
          if (webView && props.onWebView) {
            props.onWebView(webView);
          }
        }}
        source={{ uri: props.url }}
        onMessage={props.onMessage}
        onLoad={() => {
          props.onLoad?.();
        }}
        startInLoadingState
        renderLoading={() => <WebViewLoader />}
        javaScriptEnabled={true}
        onError={props.onError}
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically={false}
        onShouldStartLoadWithRequest={props.onShouldStartLoadWithRequest}
      />
    </View>
  );
};

const styles = StyleSheet.create({ container: { flex: 1 } });
