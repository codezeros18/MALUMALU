import { useFocusEffect } from 'expo-router';
import { sha256 } from 'js-sha256';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { getChain, getChainBackup, setChain, setChainBackup } from '../lib/db';
import { verifyChain, type VerifyResult } from '../lib/hashchain';
import { colors, fonts, spacing } from '../theme/tokens';
import type { HashChainEntry } from '../types';

const short = (h: string) => `${h.slice(0, 16)}…`;

export function HashChainViewer() {
  const [chain, setChainState] = useState<HashChainEntry[]>([]);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [tampered, setTampered] = useState(false);

  const reload = useCallback(async (verify = false) => {
    const c = await getChain();
    setChainState(c);
    setResult(verify ? verifyChain(c) : null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const onVerify = async () => {
    const c = await getChain();
    setChainState(c);
    setResult(verifyChain(c));
  };

  const onTamper = async () => {
    const c = await getChain();
    if (c.length === 0) return;
    await setChainBackup(c);
    const mid = Math.floor(c.length / 2);
    const bad = c.map((e, i) => (i === mid ? { ...e, dataHash: sha256('data-diubah-diam-diam') } : e));
    await setChain(bad);
    setTampered(true);
    await reload(true);
  };

  const onRestore = async () => {
    const backup = await getChainBackup();
    if (backup.length === 0) return;
    await setChain(backup);
    setTampered(false);
    await reload(true);
  };

  const brokenAt = result && !result.valid ? result.brokenAt : null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Rantai Verifikasi</Text>
      <Text style={styles.sub}>
        Setiap kartu dibubuhi entri hash berantai. Mengubah satu data merusak seluruh rantai
        setelahnya — bukti anti-manipulasi (tamper-evident).
      </Text>

      <View style={styles.btnRow}>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
          onPress={onVerify}
        >
          <Text style={styles.btnPrimaryText}>Verifikasi Rantai</Text>
        </Pressable>
        {tampered ? (
          <Pressable
            style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.pressed]}
            onPress={onRestore}
          >
            <Text style={styles.btnOutlineText}>↩️ Pulihkan Data</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              styles.btnOutline,
              chain.length === 0 && styles.disabled,
              pressed && styles.pressed,
            ]}
            onPress={onTamper}
            disabled={chain.length === 0}
          >
            <Text style={styles.btnOutlineText}>🧪 Simulasi Ubah Data</Text>
          </Pressable>
        )}
      </View>

      {result && (
        <View style={[styles.banner, result.valid ? styles.bannerOk : styles.bannerBad]}>
          <Text style={[styles.bannerText, { color: result.valid ? colors.ok : colors.alert }]}>
            {result.valid
              ? `✅ Rantai utuh (${chain.length} entri)`
              : `⛔ Rantai RUSAK di entri #${result.brokenAt}`}
          </Text>
        </View>
      )}

      <FlatList
        data={chain}
        keyExtractor={e => String(e.index)}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        renderItem={({ item }) => {
          const bad = brokenAt !== null && item.index >= brokenAt;
          return (
            <View style={[styles.entry, bad && { backgroundColor: colors.alertBg, borderColor: colors.alert }]}>
              <Text style={styles.entryTitle}>
                #{item.index} · {item.timestamp}
              </Text>
              <Text style={styles.mono}>data  {short(item.dataHash)}</Text>
              <Text style={styles.mono}>prev  {short(item.previousHash)}</Text>
              <Text style={styles.mono}>hash  {short(item.hash)}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Rantai kosong. Simpan plot atau muat data demo dulu.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.paper },
  heading: { fontFamily: fonts.display, fontSize: 22, color: colors.cover },
  sub: { fontFamily: fonts.ui, fontSize: 12, color: colors.inkMuted, marginTop: 4, lineHeight: 17 },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  btnPrimary: { backgroundColor: colors.action },
  btnPrimaryText: { fontFamily: fonts.uiBold, fontSize: 14, color: colors.onCover },
  btnOutline: { borderWidth: 1, borderColor: colors.cover },
  btnOutlineText: { fontFamily: fonts.uiBold, fontSize: 14, color: colors.cover },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  banner: { borderRadius: 10, padding: spacing.sm, marginTop: spacing.md, borderWidth: 1 },
  bannerOk: { backgroundColor: colors.okBg, borderColor: colors.ok },
  bannerBad: { backgroundColor: colors.alertBg, borderColor: colors.alert },
  bannerText: { fontFamily: fonts.uiBold, fontSize: 15, textAlign: 'center' },
  entry: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  entryTitle: { fontFamily: fonts.uiBold, fontSize: 12, color: colors.ink, marginBottom: 4 },
  mono: { fontFamily: fonts.mono, fontSize: 11, color: colors.inkMuted },
  empty: {
    fontFamily: fonts.ui,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
