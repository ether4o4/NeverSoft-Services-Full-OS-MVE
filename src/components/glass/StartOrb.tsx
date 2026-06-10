/**
 * StartOrb — the Vista start button, as a plain round glass orb (no Skia).
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

export interface StartOrbProps {
  size?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  pulseOnIdle?: boolean;
}

export const StartOrb: React.FC<StartOrbProps> = ({
  size = 40,
  onPress,
  onLongPress,
  style,
}) => (
  <TouchableOpacity
    onPress={onPress}
    onLongPress={onLongPress}
    activeOpacity={0.8}
    style={[
      styles.orb,
      { width: size, height: size, borderRadius: size / 2 },
      style,
    ]}>
    <Text style={[styles.glyph, { fontSize: size * 0.52 }]}>⊞</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(60,120,200,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  glyph: {
    color: '#ffffff',
    fontWeight: '700',
    marginTop: -2,
  },
});

export default StartOrb;
