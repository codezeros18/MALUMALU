import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import raster from '../data/pangalengan.json';
import { colors, fonts, radius } from '../theme/tokens';
import type { PickerProps } from './MapPicker';

const { bbox, rows, cols, cells } = raster;

const riskCells: { r: number; c: number }[] = [];
cells.forEach((rowArr: number[], r: number) =>
  rowArr.forEach((v, c) => {
    if (v === 1) riskCells.push({ r, c });
  }),
);

const toPercent = (lat: number, lng: number) => ({
  top: ((bbox.latMax - lat) / (bbox.latMax - bbox.latMin)) * 100,
  left: ((lng - bbox.lngMin) / (bbox.lngMax - bbox.lngMin)) * 100,
});

const inBbox = (lat: number, lng: number) =>
  lat >= bbox.latMin && lat <= bbox.latMax && lng >= bbox.lngMin && lng <= bbox.lngMax;

export function GridPicker({ plots, selected, onPick }: PickerProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  return (
    <View>
      <Pressable
        style={styles.grid}
        onLayout={e => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        onPress={e => {
          if (!size.w || !size.h) return;
          const x = e.nativeEvent.locationX / size.w;
          const y = e.nativeEvent.locationY / size.h;
          const lat = bbox.latMax - y * (bbox.latMax - bbox.latMin);
          const lng = bbox.lngMin + x * (bbox.lngMax - bbox.lngMin);
          onPick(lat, lng);
        }}
      >
        {riskCells.map(({ r, c }) => (
          <View
            key={`${r}-${c}`}
            style={[
              styles.riskCell,
              {
                top: `${(r / rows) * 100}%`,
                left: `${(c / cols) * 100}%`,
                width: `${100 / cols}%`,
                height: `${100 / rows}%`,
              },
            ]}
          />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <View key={`h${i}`} style={[styles.lineH, { top: `${(i + 1) * 10}%` }]} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <View key={`v${i}`} style={[styles.lineV, { left: `${(i + 1) * 10}%` }]} />
        ))}
        {plots
          .filter(p => inBbox(p.lat, p.lng))
          .map(p => {
            const pos = toPercent(p.lat, p.lng);
            return (
              <View
                key={p.id}
                style={[styles.dot, { top: `${pos.top}%`, left: `${pos.left}%` }]}
              />
            );
          })}
        {selected && inBbox(selected.lat, selected.lng) && (
          <View
            style={[
              styles.dot,
              styles.dotSelected,
              {
                top: `${toPercent(selected.lat, selected.lng).top}%`,
                left: `${toPercent(selected.lat, selected.lng).left}%`,
              },
            ]}
          />
        )}
      </Pressable>
      <Text style={styles.caption}>
        Mode offline — grid Pangalengan. Area merah = terindikasi deforestasi (peta risiko demo).
        Peta dasar butuh internet; koordinat & logika tetap jalan offline.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    height: 300,
    backgroundColor: colors.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  lineH: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  lineV: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  riskCell: { position: 'absolute', backgroundColor: colors.alertBg },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    marginLeft: -6,
    marginTop: -6,
    borderRadius: 6,
    backgroundColor: colors.cover,
    borderWidth: 2,
    borderColor: colors.card,
  },
  dotSelected: { backgroundColor: colors.alert, width: 16, height: 16, marginLeft: -8, marginTop: -8, borderRadius: 8 },
  caption: { fontFamily: fonts.ui, fontSize: 11, color: colors.inkMuted, marginTop: 6, lineHeight: 15 },
});
