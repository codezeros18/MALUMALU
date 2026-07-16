import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getCurrentPosition } from '../lib/gps';
import { prosesPlotBaru } from '../lib/prosesPlot';
import { colors, fonts, spacing } from '../theme/tokens';
import type { Kartu } from '../types';

interface PlotFormProps {
  coord: { lat: number; lng: number } | null;
  accuracyM: number | null;
  onCoordFromGps: (lat: number, lng: number, accuracyM: number | null) => void;
  onSaved: (kartu: Kartu) => void;
}

export function PlotForm({ coord, accuracyM, onCoordFromGps, onSaved }: PlotFormProps) {
  const [nama, setNama] = useState('');
  const [desa, setDesa] = useState('');
  const [telepon, setTelepon] = useState('');
  const [komoditas, setKomoditas] = useState('kopi');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onGps = async () => {
    setGpsLoading(true);
    setWarning(null);
    try {
      const fix = await getCurrentPosition();
      onCoordFromGps(fix.lat, fix.lng, fix.accuracyM);
      if (fix.accuracyM !== null && fix.accuracyM > 20) {
        setWarning(`Akurasi rendah ± ${Math.round(fix.accuracyM)} m — di bawah kanopi GPS meleset (point-primary).`);
      }
    } catch (e) {
      setWarning(e instanceof Error ? e.message : 'GPS gagal. Tap peta untuk memilih titik.');
    } finally {
      setGpsLoading(false);
    }
  };

  const canSave = nama.trim().length > 0 && coord !== null && !saving;

  const onSave = async () => {
    if (!coord) return;
    setSaving(true);
    setWarning(null);
    try {
      const kartu = await prosesPlotBaru({
        nama: nama.trim(),
        desa: desa.trim() || undefined,
        telepon: telepon.trim() || undefined,
        komoditas: komoditas.trim() || 'kopi',
        lat: coord.lat,
        lng: coord.lng,
        gpsAccuracyM: accuracyM ?? undefined,
      });
      setNama('');
      setDesa('');
      setTelepon('');
      setKomoditas('kopi');
      onSaved(kartu);
    } catch (e) {
      setWarning(e instanceof Error ? e.message : 'Gagal menyimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.heading}>Registrasi Petani & Plot</Text>

      <Text style={styles.label}>Nama petani *</Text>
      <TextInput style={styles.input} value={nama} onChangeText={setNama} placeholder="cth. Bu Sari" placeholderTextColor={colors.inkMuted} />

      <Text style={styles.label}>Desa</Text>
      <TextInput style={styles.input} value={desa} onChangeText={setDesa} placeholder="cth. Margamukti" placeholderTextColor={colors.inkMuted} />

      <Text style={styles.label}>Telepon</Text>
      <TextInput style={styles.input} value={telepon} onChangeText={setTelepon} placeholder="cth. 0812…" placeholderTextColor={colors.inkMuted} keyboardType="phone-pad" />

      <Text style={styles.label}>Komoditas</Text>
      <TextInput style={styles.input} value={komoditas} onChangeText={setKomoditas} placeholderTextColor={colors.inkMuted} />

      <View style={styles.coordRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Titik plot</Text>
          <Text style={styles.coordText}>
            {coord
              ? `${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)}${accuracyM !== null ? `  (± ${Math.round(accuracyM)} m)` : ''}`
              : 'Belum ada titik — tap peta / pakai GPS'}
          </Text>
        </View>
        <Pressable style={({ pressed }) => [styles.gpsBtn, pressed && styles.pressed]} onPress={onGps} disabled={gpsLoading}>
          {gpsLoading ? (
            <ActivityIndicator color={colors.cover} size="small" />
          ) : (
            <Text style={styles.gpsBtnText}>📍 Pakai GPS</Text>
          )}
        </Pressable>
      </View>

      {warning && (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>{warning}</Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.saveBtn, !canSave && styles.disabled, pressed && styles.pressed]}
        onPress={onSave}
        disabled={!canSave}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Menyimpan…' : 'Simpan Plot'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: 6,
  },
  heading: { fontFamily: fonts.display, fontSize: 17, color: colors.cover, marginBottom: 4 },
  label: { fontFamily: fonts.mono, fontSize: 10, color: colors.inkMuted, letterSpacing: 1, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 46,
    fontFamily: fonts.ui,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.paper,
  },
  coordRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: 4 },
  coordText: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink, marginTop: 4 },
  gpsBtn: {
    borderWidth: 1,
    borderColor: colors.cover,
    borderRadius: 8,
    minHeight: 46,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsBtnText: { fontFamily: fonts.uiBold, fontSize: 13, color: colors.cover },
  warnBox: {
    backgroundColor: colors.warnBg,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: 6,
  },
  warnText: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.warn },
  saveBtn: {
    backgroundColor: colors.action,
    borderRadius: 10,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: { fontFamily: fonts.uiBold, fontSize: 16, color: colors.onCover },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
