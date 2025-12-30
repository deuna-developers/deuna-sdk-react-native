import { ActivityIndicator, StyleSheet, View } from 'react-native';

export const WebViewLoader = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
