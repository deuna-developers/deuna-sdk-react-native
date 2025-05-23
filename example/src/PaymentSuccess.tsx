import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentSuccess'>;

export const PaymentSuccess = ({ route }: Props) => {
  const { order } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Pago Exitoso!</Text>
      <Text style={styles.subtitle}>
        Tu pago ha sido procesado correctamente
      </Text>
      <ScrollView style={styles.scrollView}>
        <Text>{JSON.stringify(order)}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4CAF50',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
});
