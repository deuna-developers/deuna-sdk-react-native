import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TopBarProps {
  title: string;
  onOpenDrawer: () => void;
  showRefresh?: boolean;
  onRefresh?: () => void;
}

export const TopBar = ({ title, onOpenDrawer, showRefresh, onRefresh }: TopBarProps) => (
  <View style={styles.bar}>
    <TouchableOpacity onPress={onOpenDrawer} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Text style={styles.hamburger}>☰</Text>
    </TouchableOpacity>

    <Text style={styles.title} numberOfLines={1}>
      {title}
    </Text>

    {showRefresh ? (
      <TouchableOpacity
        onPress={onRefresh}
        style={styles.iconBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.refreshIcon}>↺</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.iconBtn} />
    )}
  </View>
);

const styles = StyleSheet.create({
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  iconBtn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburger: {
    color: '#147AE8',
    fontSize: 22,
  },
  refreshIcon: {
    color: '#147AE8',
    fontSize: 22,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#1B2B6E',
    fontSize: 16,
    fontWeight: '600',
  },
});
