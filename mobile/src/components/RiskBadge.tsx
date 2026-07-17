import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/tokens';
import type { Petani, Plot } from '../types';
import { scoreSupplierDemo } from '../lib/riskDemo';

const VARIANT = {
  low: { bar: colors.ok, text: colors.ok, bg: colors.okBg, label: 'RISIKO RENDAH' },
  medium: { bar: colors.warn, text: colors.warn, bg: colors.warnBg, label: 'RISIKO SEDANG' },
  high: { bar: colors.alert, text: colors.alert, bg: colors.alertBg, label: 'RISIKO TINGGI' },
} as const;

export function RiskBadge({ petani, plot }: { petani: Petani; plot?: Plot }) {
  if (!plot) return null;
  const risk = scoreSupplierDemo(petani, plot);
  const v = VARIANT[risk.label];
  return (
    <View style={[styles.box, { backgroundColor: v.bg, borderLeftColor: v.bar }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: v.text }]}>RISIKO SUPPLIER · ML</Text>
        <Text style={[styles.score, { color: v.text }]}>{risk.skor}/100</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${risk.skor}%`, backgroundColor: v.bar }]} />
      </View>

      <Text style={[styles.label, { color: v.text }]}>{v.label}</Text>

      {risk.faktor.length > 0 ? (
        risk.faktor.map((f, i) => (
          <Text key={i} style={styles.factor}>
            • {f}
          </Text>
        ))
      ) : (
        <Text style={styles.factor}>• Tak ada faktor risiko terdeteksi</Text>
      )}

      {risk.demo && <Text style={styles.demo}>Model demonstrasi · dilatih 12 data buatan, bukan operasional.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: spacing.sm,
    borderRadius: radius.input,
    padding: spacing.sm,
    borderLeftWidth: 3,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1 },
  score: { fontFamily: fonts.uiBold, fontSize: 16 },
  track: {
    height: 6,
    backgroundColor: colors.line,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: 3 },
  label: { fontFamily: fonts.uiBold, fontSize: 12, marginTop: 5, letterSpacing: 0.5 },
  factor: { fontFamily: fonts.ui, fontSize: 12, color: colors.ink, lineHeight: 17, marginTop: 2 },
  demo: { fontFamily: fonts.ui, fontSize: 9, color: colors.inkMuted, marginTop: 5, fontStyle: 'italic' },
});
