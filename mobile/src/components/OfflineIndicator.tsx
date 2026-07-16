import { StyleSheet, Text, View } from 'react-native';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { colors, fonts, spacing } from '../theme/tokens';

export function OfflineIndicator() {
  const online = useOnlineStatus();
  return (
    <View style={[styles.chip, online ? styles.online : styles.offline]}>
      <Text style={[styles.text, online ? styles.textOnline : styles.textOffline]}>
        {online ? '🟢 Online' : '🔴 Offline (mode lapangan)'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: spacing.md,
  },
  online: { backgroundColor: 'rgba(247, 243, 232, 0.15)' },
  offline: { backgroundColor: colors.alertBg },
  text: { fontFamily: fonts.uiBold, fontSize: 11 },
  textOnline: { color: colors.onCover },
  textOffline: { color: colors.alert },
});
