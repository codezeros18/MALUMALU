import { StyleSheet, Text, View } from 'react-native';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { colors, fonts, radius, spacing } from '../theme/tokens';

export function OfflineIndicator() {
  const online = useOnlineStatus();
  return (
    <View style={[styles.chip, online ? styles.online : styles.offline]}>
      <Text style={[styles.text, online ? styles.textOnline : styles.textOffline]}>
        {online ? 'Online' : 'Offline · mode lapangan'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: spacing.md,
    minHeight: 28,
    justifyContent: 'center',
  },
  online: { backgroundColor: colors.okBg },
  offline: { backgroundColor: colors.alertBg },
  text: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 0.3 },
  textOnline: { color: colors.ok },
  textOffline: { color: colors.alert },
});
