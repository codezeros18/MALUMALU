import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { seedDummyData } from '../../data/dummyData';
import { clearAllData } from '../../lib/db';
import { colors, fonts, spacing } from '../../theme/tokens';

export default function LapanganScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onSeed = async () => {
    setBusy(true);
    try {
      const n = await seedDummyData();
      if (n > 0) {
        Alert.alert('Data demo dimuat', `${n} petani demo ditambahkan. Lihat tab Kartu.`);
        router.push('/kartu');
      } else {
        Alert.alert('Sudah ada data', 'Data demo tidak dimuat ulang. Hapus semua data dulu bila perlu.');
      }
    } catch (e) {
      Alert.alert('Gagal', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  const onReset = () => {
    Alert.alert('Hapus semua data?', 'Semua petani, plot, kartu, dan rantai akan dihapus.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await clearAllData();
          Alert.alert('Bersih', 'Semua data dihapus.');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lapangan</Text>
      <Text style={styles.subtitle}>Peta & registrasi plot menyusul di langkah berikutnya.</Text>
      <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={onSeed} disabled={busy}>
        <Text style={styles.primaryBtnText}>Muat Data Demo</Text>
      </Pressable>
      <Pressable style={({ pressed }) => [styles.dangerBtn, pressed && styles.pressed]} onPress={onReset}>
        <Text style={styles.dangerBtnText}>Hapus Semua Data</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: spacing.md, gap: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.cover },
  subtitle: { fontFamily: fonts.ui, fontSize: 13, color: colors.inkMuted },
  primaryBtn: {
    backgroundColor: colors.action,
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: fonts.uiBold, fontSize: 16, color: colors.onCover },
  dangerBtn: {
    borderColor: colors.alert,
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtnText: { fontFamily: fonts.uiBold, fontSize: 15, color: colors.alert },
  pressed: { opacity: 0.7 },
});
