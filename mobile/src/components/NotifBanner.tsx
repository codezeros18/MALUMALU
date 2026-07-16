import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNotifs, markNotifRead } from '../lib/db';
import { colors, fonts, spacing } from '../theme/tokens';
import type { NotifItem } from '../types';

const POLL_MS = 3000;

export function NotifBanner() {
  const [notif, setNotif] = useState<NotifItem | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const all = await getNotifs();
      if (!active) return;
      const unread = all.filter(n => !n.read && n.severity === 'alert');
      setNotif(unread.length > 0 ? unread[unread.length - 1] : null);
    };
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (!notif) return null;

  const onRead = async () => {
    await markNotifRead(notif.id);
    setNotif(null);
  };

  return (
    <View style={[styles.banner, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={styles.pesan}>🚨 {notif.pesan}</Text>
      <Pressable onPress={onRead} style={({ pressed }) => [styles.readBtn, pressed && { opacity: 0.7 }]}>
        <Text style={styles.readBtnText}>Tandai dibaca</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.alert,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pesan: { flex: 1, fontFamily: fonts.uiBold, fontSize: 13, color: colors.onCover, lineHeight: 18 },
  readBtn: {
    borderWidth: 1,
    borderColor: colors.onCover,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: 'center',
  },
  readBtnText: { fontFamily: fonts.uiBold, fontSize: 12, color: colors.onCover },
});
