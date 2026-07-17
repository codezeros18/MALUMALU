import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';

type Variant = 'ok' | 'warn' | 'alert' | 'neutral';

const VARIANT_STYLES: Record<Variant, { bg: string; fg: string }> = {
  ok: { bg: colors.okBg, fg: colors.ok },
  warn: { bg: colors.warnBg, fg: colors.warn },
  alert: { bg: colors.alertBg, fg: colors.alert },
  neutral: { bg: colors.neutralBg, fg: colors.neutral },
};

interface BadgeProps {
  label: string;
  variant?: Variant;
  outline?: boolean;
}

export function Badge({ label, variant = 'neutral', outline = false }: BadgeProps) {
  const v = VARIANT_STYLES[variant];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: outline ? 'transparent' : v.bg },
        outline && { borderWidth: 1, borderColor: v.fg },
      ]}
    >
      <Text style={[styles.label, { color: v.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    minHeight: 22,
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
