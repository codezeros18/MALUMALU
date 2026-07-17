import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { colors, fonts, radius } from '../theme/tokens';
import type { Plot } from '../types';

export interface PickerProps {
  plots: Plot[];
  selected: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}

export function MapPicker({ plots, selected, onPick }: PickerProps) {
  return (
    <View style={styles.wrap}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -7.15,
          longitude: 107.62,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        onPress={e => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          onPick(latitude, longitude);
        }}
      >
        {plots.map(p => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            pinColor={colors.cover}
          />
        ))}
        {selected && (
          <Marker coordinate={{ latitude: selected.lat, longitude: selected.lng }} />
        )}
      </MapView>
      <View style={styles.hint}>
        <Text style={styles.hintText}>Tap peta untuk memilih titik plot</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.card, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  map: { height: 300, width: '100%' },
  hint: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    backgroundColor: colors.cover,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  hintText: { fontFamily: fonts.uiMedium, fontSize: 11, color: colors.onCover },
});
