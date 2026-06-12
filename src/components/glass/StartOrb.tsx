/**
 * StartOrb — the Vista start button: a glossy gradient orb (no Skia).
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

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
    style={[{ width: size, height: size }, style]}>
    <LinearGradient
      colors={['#8fd0ff', '#3a86d4', '#123a66']}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={[styles.orb, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.glyph, { fontSize: size * 0.5 }]}>⊞</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  glyph: {
    color: '#ffffff',
    fontWeight: '700',
    marginTop: -2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default StartOrb;
