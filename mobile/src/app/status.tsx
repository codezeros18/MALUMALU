import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { cekDeforestasi } from '../lib/geospatial';
import { evaluateKartu } from '../lib/ruleEngine';
import { getKartus, getPetani, getPlots } from '../lib/db';
import { Badge } from '../components/Badge';
import { colors, fonts, radius, spacing } from '../theme/tokens';
import type { Kartu, Petani, Plot } from '../types';

interface PasporView {
  petani: Petani;
  plot?: Plot;
  kartu?: Kartu;
  stdbLengkap: boolean;
  gpsOk: boolean;
  lengkap: boolean;
  tier: 'lokal' | 'export_ready';
}

function buildView(petani: Petani, plot: Plot | undefined, kartu: Kartu | undefined): PasporView {
  const cek = plot
    ? cekDeforestasi(plot.lat, plot.lng)
    : { status: 'di_luar_area' as const, cellValue: null, source: '', catatan: '' };
  // punyaSTDB tidak tersimpan di Petani/Plot (sama seperti web — hanya input sesaat
  // waktu Kartu dibuat, lihat ruleEngine.ts). Layar ini cuma pratinjau cadangan dipakai
  // saat BELUM ada Kartu tersimpan (lihat `tier` di bawah) — default false (konservatif,
  // tidak pernah overclaim export-ready tanpa Kartu nyata yang mengonfirmasinya).
  const rule = evaluateKartu(
    petani,
    plot ?? ({ id: '', petaniId: petani.id, lat: 0, lng: 0, komoditas: '', capturedAt: '' } as Plot),
    cek,
    false,
  );
  const stdbLengkap = Boolean(petani.nama && petani.desa && petani.telepon);
  const gpsOk = !plot || plot.gpsAccuracyM === undefined || plot.gpsAccuracyM <= 20;
  return {
    petani,
    plot,
    kartu,
    stdbLengkap,
    gpsOk,
    lengkap: stdbLengkap && gpsOk,
    tier: kartu?.tier ?? rule.tier,
  };
}

export default function StatusScreen() {
  const { telepon } = useLocalSearchParams<{ telepon?: string }>();
  const [view, setView] = useState<PasporView | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    let active = true;
    (async () => {
      const [petanis, plots, kartus] = await Promise.all([getPetani(), getPlots(), getKartus()]);
      if (!active) return;
      const phone = typeof telepon === 'string' ? telepon.replace(/\D/g, '') : '';
      const petani = petanis.find(p => (p.telepon ?? '').replace(/\D/g, '') === phone);
      if (!petani) {
        setNotFound(true);
        setView(null);
        return;
      }
      const plot = plots.find(p => p.petaniId === petani.id);
      const kartu = kartus
        .filter(k => k.petaniId === petani.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      setNotFound(false);
      setView(buildView(petani, plot, kartu));
    })();
    return () => {
      active = false;
    };
  }, [telepon]);

  useFocusEffect(load);

  const title = 'Status Paspor';

  if (notFound) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>{title}</Text>
        <View style={styles.card}>
          <Text style={styles.body}>
            Nomor tidak terdaftar. Petani belum memiliki Paspor Petani.
          </Text>
        </View>
      </View>
    );
  }

  if (!view) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>{title}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>{title}</Text>
      <Text style={styles.sub}>{view.petani.nama}{view.petani.desa ? ` · ${view.petani.desa}` : ''}</Text>

      <View style={styles.card}>
        <View style={styles.tierRow}>
          <Text style={styles.cardTitle}>Tier saat ini</Text>
          <Badge
            label={view.tier === 'export_ready' ? 'EXPORT-READY' : 'LOKAL'}
            variant={view.tier === 'export_ready' ? 'ok' : 'warn'}
          />
        </View>

        <View style={styles.ruleDouble} />

        <View style={styles.checkRow}>
          <Text style={styles.checkLabel}>STDB (data lengkap)</Text>
          <Badge label={view.stdbLengkap ? 'LENGKAP' : 'BELUM'} variant={view.stdbLengkap ? 'ok' : 'warn'} />
        </View>
        <View style={styles.checkRow}>
          <Text style={styles.checkLabel}>GPS (akurasi ≤ 20 m)</Text>
          <Badge label={view.gpsOk ? 'OK' : 'LEMAH'} variant={view.gpsOk ? 'ok' : 'warn'} />
        </View>

        <View style={[styles.summary, view.lengkap && styles.summaryOk]}>
          <Text style={styles.summaryText}>
            {view.lengkap
              ? 'Paspor lengkap (STDB+GPS). Berhak memperoleh harga di kisaran atas.'
              : 'Lengkapi STDB dan pastikan GPS akurat untuk memperoleh harga kisaran atas.'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  header: { fontFamily: fonts.display, fontSize: 22, color: colors.cover },
  sub: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.inkMuted },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
  tierRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontFamily: fonts.uiBold, fontSize: 14, color: colors.ink },
  ruleDouble: { height: 3, backgroundColor: colors.cover, marginVertical: spacing.sm },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  checkLabel: { fontFamily: fonts.ui, fontSize: 14, color: colors.ink },
  summary: {
    marginTop: spacing.sm,
    backgroundColor: colors.warnBg,
    borderRadius: radius.input,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.warn,
  },
  summaryOk: { backgroundColor: colors.okBg, borderLeftColor: colors.ok },
  summaryText: { fontFamily: fonts.ui, fontSize: 13, color: colors.ink, lineHeight: 19 },
  body: { fontFamily: fonts.ui, fontSize: 14, color: colors.ink, lineHeight: 20 },
});
