import { StyleSheet } from 'react-native';

export const textStyle = { color: 'white', textAlign: 'center' as const };

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { padding: 15, flex: 1 },
  row: { justifyContent: 'space-between' },
  flatList: { flexGrow: 0, marginTop: 10 },
  embeddedContainer: { flex: 1, backgroundColor: '#d2d2d2', borderRadius: 10 },
  embeddedSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    margin: 4,
    flex: 1,
  },
  sessionIdButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    margin: 4,
  },
});
