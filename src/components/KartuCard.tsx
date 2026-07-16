import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme/tokens';
import type { Kartu, Petani, Plot } from '../types';
import { Badge } from './Badge';

interface KartuCardProps {
  kartu: Kartu;
  petani?: Petani;
  plot?: Plot;
  footer?: React.ReactNode;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const DEFORESTASI_LABEL: Record<Kartu['deforestasi']['status'], { text: string; variant: 'ok' | 'alert' | 'warn' }> = {
  aman: { text: 'BEBAS DEFORESTASI', variant: 'ok' },
  terindikasi: { text: 'TERINDIKASI DEFORESTASI', variant: 'alert' },
  di_luar_area: { text: 'DI LUAR AREA PETA', variant: 'warn' },
};

export function KartuCard({ kartu, petani, plot, footer }: KartuCardProps) {
  const isExport = kartu.tier === 'export_ready';
  const defo = DEFORESTASI_LABEL[kartu.deforestasi.status];
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.passportTitle}>PASPOR PETANI</Text>
          <Text style={styles.passportSub}>KARTU DATA PLOT · REPUBLIK KOPI PANGALENGAN</Text>
        </View>
        <View style={[styles.stamp, { borderColor: isExport ? colors.ok : colors.warn }]}>
          <Text style={[styles.stampText, { color: isExport ? colors.ok : colors.warn }]}>
            {isExport ? 'EXPORT-READY' : 'LOKAL'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Row label="NAMA" value={petani?.nama ?? '—'} />
      <Row label="DESA" value={petani?.desa ?? '—'} />
      <Row label="TELEPON" value={petani?.telepon ?? '—'} />
      <Row label="KOMODITAS" value={plot?.komoditas ?? '—'} />
      <Row
        label="KOORDINAT"
        value={plot ? `${plot.lat.toFixed(5)}, ${plot.lng.toFixed(5)}` : '—'}
      />
      <Row
        label="AKURASI GPS"
        value={plot?.gpsAccuracyM !== undefined ? `± ${Math.round(plot.gpsAccuracyM)} m` : '—'}
      />

      <View style={styles.badgeRow}>
        <Badge label={defo.text} variant={defo.variant} />
        <Badge label={kartu.stdbStatus === 'lengkap' ? 'STDB LENGKAP' : 'STDB BELUM LENGKAP'} variant={kartu.stdbStatus === 'lengkap' ? 'ok' : 'warn'} />
        {kartu.overrideManual && <Badge label="OVERRIDE MANUAL" variant="warn" outline />}
        <Badge label="DATA DEMO" variant="alert" outline />
      </View>

      <View style={styles.alasanBox}>
        {kartu.alasan.map((a, i) => (
          <Text key={i} style={styles.alasan}>
            • {a}
          </Text>
        ))}
      </View>

      <Text style={styles.finePrint}>{kartu.deforestasi.catatan}</Text>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  passportTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.cover },
  passportSub: { fontFamily: fonts.mono, fontSize: 9, color: colors.inkMuted, marginTop: 2 },
  stamp: {
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    transform: [{ rotate: '-6deg' }],
  },
  stampText: { fontFamily: fonts.uiBold, fontSize: 12, letterSpacing: 1 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    paddingVertical: 6,
    gap: spacing.sm,
  },
  rowLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkMuted, letterSpacing: 1 },
  rowValue: { fontFamily: fonts.uiBold, fontSize: 14, color: colors.ink, flexShrink: 1, textAlign: 'right' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  alasanBox: { marginTop: spacing.sm, backgroundColor: colors.paper, borderRadius: 8, padding: spacing.sm },
  alasan: { fontFamily: fonts.ui, fontSize: 13, color: colors.ink, lineHeight: 19 },
  finePrint: { fontFamily: fonts.ui, fontSize: 10, color: colors.inkMuted, marginTop: spacing.sm, lineHeight: 14 },
});
