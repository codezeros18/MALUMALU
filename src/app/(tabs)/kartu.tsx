import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { KartuCard } from '../../components/KartuCard';
import { getKartus, getPetani, getPlots } from '../../lib/db';
import { colors, fonts, spacing } from '../../theme/tokens';
import type { Kartu, Petani, Plot } from '../../types';

export default function KartuScreen() {
  const [kartus, setKartus] = useState<Kartu[]>([]);
  const [petani, setPetani] = useState<Petani[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);

  const load = useCallback(() => {
    let active = true;
    (async () => {
      const [k, p, pl] = await Promise.all([getKartus(), getPetani(), getPlots()]);
      if (!active) return;
      setKartus([...k].reverse());
      setPetani(p);
      setPlots(pl);
    })();
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(load);

  return (
    <View style={styles.container}>
      <FlatList
        data={kartus}
        keyExtractor={k => k.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <KartuCard
            kartu={item}
            petani={petani.find(p => p.id === item.petaniId)}
            plot={plots.find(p => p.id === item.plotId)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Belum ada kartu.{'\n'}Tandai plot di tab Lapangan atau muat data demo.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  empty: {
    fontFamily: fonts.ui,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.xl * 2,
    lineHeight: 22,
  },
});
