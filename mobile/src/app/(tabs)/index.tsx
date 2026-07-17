import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GridPicker } from '../../components/GridPicker';
import { MapPicker } from '../../components/MapPicker';
import { PlotForm } from '../../components/PlotForm';
import { seedDummyData } from '../../data/dummyData';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { clearAllData, getKartus, getPetani, getPlots } from '../../lib/db';
import { colors, fonts, radius, spacing } from '../../theme/tokens';
import type { Kartu, Petani, Plot } from '../../types';

export default function LapanganScreen() {
  const router = useRouter();
  const online = useOnlineStatus();
  const [forceGrid, setForceGrid] = useState(false);
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [petani, setPetani] = useState<Petani[]>([]);
  const [kartus, setKartus] = useState<Kartu[]>([]);

  const load = useCallback(() => {
    let active = true;
    (async () => {
      const [pl, pt, ka] = await Promise.all([getPlots(), getPetani(), getKartus()]);
      if (!active) return;
      setPlots(pl);
      setPetani(pt);
      setKartus(ka);
    })();
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(load);

  const useGrid = forceGrid || !online;
  const Picker = useGrid ? GridPicker : MapPicker;

  const onPickFromMap = (lat: number, lng: number) => {
    setCoord({ lat, lng });
    setAccuracyM(null);
  };

  const onSaved = (kartu: Kartu) => {
    setCoord(null);
    setAccuracyM(null);
    load();
    Alert.alert(
      'Plot tersimpan',
      `Kartu dibuat — tier ${kartu.tier === 'export_ready' ? 'EXPORT-READY' : 'LOKAL'}.`,
      [{ text: 'Lihat Kartu', onPress: () => router.push('/kartu') }, { text: 'OK' }],
    );
  };

  const onSeed = async () => {
    try {
      const n = await seedDummyData();
      if (n > 0) {
        load();
        Alert.alert('Data demo dimuat', `${n} petani demo ditambahkan. Lihat tab Kartu.`);
      } else {
        Alert.alert('Sudah ada data', 'Data demo tidak dimuat ulang. Hapus semua data dulu bila perlu.');
      }
    } catch (e) {
      Alert.alert('Gagal', e instanceof Error ? e.message : 'Terjadi kesalahan.');
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
          setCoord(null);
          setAccuracyM(null);
          load();
        },
      },
    ]);
  };

  const tierOf = (plotId: string) => kartus.find(k => k.plotId === plotId)?.tier;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Tandai Plot Kebun</Text>
        <Pressable onPress={() => setForceGrid(g => !g)} style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
          <Text style={styles.toggleText}>{useGrid ? 'Grid' : 'Peta'} ⇄</Text>
        </Pressable>
      </View>

      <Picker plots={plots} selected={coord} onPick={onPickFromMap} />

      <PlotForm
        coord={coord}
        accuracyM={accuracyM}
        onCoordFromGps={(lat, lng, acc) => {
          setCoord({ lat, lng });
          setAccuracyM(acc);
        }}
        onSaved={onSaved}
      />

      {plots.length > 0 && (
        <View style={styles.plotList}>
          <Text style={styles.plotListTitle}>Plot tersimpan ({plots.length})</Text>
          {plots.map(p => {
            const owner = petani.find(x => x.id === p.petaniId);
            const tier = tierOf(p.id);
            return (
              <View key={p.id} style={styles.plotRow}>
                <Text style={styles.plotName}>{owner?.nama ?? '—'}</Text>
                <Text style={styles.plotMeta}>
                  {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                  {tier ? ` · ${tier === 'export_ready' ? 'EXPORT-READY' : 'LOKAL'}` : ''}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.demoRow}>
        <Pressable style={({ pressed }) => [styles.demoBtn, pressed && styles.pressed]} onPress={onSeed}>
          <Text style={styles.demoBtnText}>Muat Data Demo</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]} onPress={onReset}>
          <Text style={styles.resetBtnText}>Hapus Semua Data</Text>
        </Pressable>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.cover },
  toggle: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.card,
    minHeight: 36,
    justifyContent: 'center',
  },
  toggleText: { fontFamily: fonts.uiBold, fontSize: 12, color: colors.cover },
  plotList: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    padding: spacing.md,
  },
  plotListTitle: { fontFamily: fonts.uiBold, fontSize: 13, color: colors.ink, marginBottom: 6 },
  plotRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingVertical: 8,
  },
  plotName: { fontFamily: fonts.uiBold, fontSize: 14, color: colors.ink },
  plotMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.inkMuted, marginTop: 2 },
  demoRow: { flexDirection: 'row', gap: spacing.sm },
  demoBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cover,
    borderRadius: radius.input,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBtnText: { fontFamily: fonts.uiBold, fontSize: 14, color: colors.cover },
  resetBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.alert,
    borderRadius: radius.input,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: { fontFamily: fonts.uiBold, fontSize: 14, color: colors.alert },
  pressed: { opacity: 0.6, transform: [{ translateY: 1 }] },
});
