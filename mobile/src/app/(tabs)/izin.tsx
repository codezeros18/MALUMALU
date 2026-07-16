import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { setConsent, simulateAccess } from '../../lib/consent';
import { getAccessLogs, getConsents, getKartus, getPetani } from '../../lib/db';
import { colors, fonts, spacing } from '../../theme/tokens';
import type { AccessLog, ConsentRecord, Kartu, Petani } from '../../types';

const PIHAK_LIST = ['Koperasi', 'Dinas Pertanian', 'Eksportir X'];

export default function IzinScreen() {
  const [kartus, setKartus] = useState<Kartu[]>([]);
  const [petani, setPetani] = useState<Petani[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    (async () => {
      const [k, p, c, l] = await Promise.all([getKartus(), getPetani(), getConsents(), getAccessLogs()]);
      if (!active) return;
      setKartus(k);
      setPetani(p);
      setConsents(c);
      setLogs(l);
    })();
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(load);

  const selected = kartus.find(k => k.id === selectedId) ?? kartus[0];
  const namaOf = (kartu: Kartu) => petani.find(p => p.id === kartu.petaniId)?.nama ?? kartu.id;
  const isGranted = (pihak: string) =>
    consents.some(c => c.kartuId === selected?.id && c.pihak === pihak && c.granted);

  const onToggle = async (pihak: string, granted: boolean) => {
    if (!selected) return;
    try {
      await setConsent(selected.id, pihak, granted);
      load();
    } catch (e) {
      Alert.alert('Gagal', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  };

  const onAksesBerizin = async () => {
    if (!selected) return;
    const pihak = PIHAK_LIST.find(isGranted) ?? 'Koperasi';
    await simulateAccess(selected.id, pihak);
    load();
  };

  const onAksesTakBerizin = async () => {
    if (!selected) return;
    const pihak = PIHAK_LIST.find(p => !isGranted(p));
    if (!pihak) {
      Alert.alert('Semua pihak berizin', 'Cabut satu izin dulu untuk mensimulasikan akses tak-berizin.');
      return;
    }
    await simulateAccess(selected.id, pihak);
    load();
  };

  if (kartus.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.empty}>
          Belum ada kartu.{'\n'}Tandai plot di tab Lapangan atau muat data demo.
        </Text>
      </View>
    );
  }

  const selectedLogs = logs.filter(l => l.kartuId === selected?.id).reverse();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Izin & Akses Data</Text>

      <View style={styles.chipRow}>
        {kartus.map(k => {
          const active = k.id === selected?.id;
          return (
            <Pressable
              key={k.id}
              onPress={() => setSelectedId(k.id)}
              style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{namaOf(k)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Izin akses kartu {selected ? namaOf(selected) : ''}</Text>
        <Text style={styles.panelHint}>Petani menentukan siapa boleh membaca data kartunya.</Text>
        {PIHAK_LIST.map(pihak => (
          <View key={pihak} style={styles.consentRow}>
            <Text style={styles.consentLabel}>{pihak}</Text>
            <Switch
              value={isGranted(pihak)}
              onValueChange={v => onToggle(pihak, v)}
              trackColor={{ true: colors.action, false: colors.line }}
              thumbColor={colors.card}
            />
          </View>
        ))}
      </View>

      <View style={styles.btnRow}>
        <Pressable style={({ pressed }) => [styles.okBtn, pressed && { opacity: 0.7 }]} onPress={onAksesBerizin}>
          <Text style={styles.okBtnText}>Simulasi Akses Berizin</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.alertBtn, pressed && { opacity: 0.7 }]} onPress={onAksesTakBerizin}>
          <Text style={styles.alertBtnText}>🚨 Simulasi Akses Tak-Berizin</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Log akses ({selectedLogs.length})</Text>
        {selectedLogs.length === 0 && (
          <Text style={styles.panelHint}>Belum ada akses tercatat untuk kartu ini.</Text>
        )}
        {selectedLogs.map(l => (
          <View key={l.id} style={styles.logRow}>
            <Text style={styles.logTime}>
              {new Date(l.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
            <Text style={styles.logPihak}>{l.pihak}</Text>
            <Text style={[styles.logStatus, { color: l.authorized ? colors.ok : colors.alert }]}>
              {l.authorized ? '✅ berizin' : '⛔ tak-berizin'}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  emptyContainer: { flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  empty: { fontFamily: fonts.ui, fontSize: 14, color: colors.inkMuted, textAlign: 'center', lineHeight: 22 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.cover },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.cover, borderColor: colors.cover },
  chipText: { fontFamily: fonts.uiBold, fontSize: 13, color: colors.ink },
  chipTextActive: { color: colors.onCover },
  panel: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
  panelTitle: { fontFamily: fonts.uiBold, fontSize: 14, color: colors.ink },
  panelHint: { fontFamily: fonts.ui, fontSize: 12, color: colors.inkMuted, marginTop: 4 },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingVertical: 8,
    marginTop: 8,
    minHeight: 48,
  },
  consentLabel: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.ink },
  btnRow: { gap: spacing.sm },
  okBtn: {
    backgroundColor: colors.action,
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okBtnText: { fontFamily: fonts.uiBold, fontSize: 14, color: colors.onCover },
  alertBtn: {
    borderWidth: 1,
    borderColor: colors.alert,
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBtnText: { fontFamily: fonts.uiBold, fontSize: 14, color: colors.alert },
  logRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingVertical: 8,
    marginTop: 8,
  },
  logTime: { fontFamily: fonts.mono, fontSize: 11, color: colors.inkMuted },
  logPihak: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.ink, flex: 1 },
  logStatus: { fontFamily: fonts.uiBold, fontSize: 12 },
});
