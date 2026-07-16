import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export default function RantaiScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Rantai</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  text: { fontFamily: fonts.uiBold, fontSize: 18, color: colors.ink },
});
