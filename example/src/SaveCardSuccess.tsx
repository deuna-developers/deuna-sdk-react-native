import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';

type Props = NativeStackScreenProps<RootStackParamList, 'SaveCardSuccess'>;

export const SaveCardSuccess = ({ route }: Props) => {
  const { data } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Tarjeta Guardada!</Text>
      <Text style={styles.subtitle}>
        Tu tarjeta ha sido guardada exitosamente
      </Text>
      <Text>{JSON.stringify(data.metadata, null, 2)}</Text>
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
});
