/**
 * AppIcon — a macOS-style squircle app tile: a rounded gradient square with an
 * emoji/glyph (or image) centered. Used by the Dock and Launchpad.
 */
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export interface AppIconProps {
  label?: string;
  glyph?: string;
  image?: ImageSourcePropType;
  colors?: [string, string];
  size?: number;
  showLabel?: boolean;
  labelColor?: string;
  onPress?: () => void;
  onLongPress?: () => void;
}

const AppIcon: React.FC<AppIconProps> = ({
  label,
  glyph,
  image,
  colors = ['#5b8def', '#3a6fd0'],
  size = 54,
  showLabel = false,
  labelColor = '#ffffff',
  onPress,
  onLongPress,
}) => {
  const radius = size * 0.23; // squircle
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.wrap}>
      <View style={[styles.tileShadow, { width: size, height: size, borderRadius: radius }]}>
        <LinearGradient
          colors={colors}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.tile, { width: size, height: size, borderRadius: radius }]}>
          {image ? (
            <Image source={image} style={{ width: size, height: size, borderRadius: radius }} resizeMode="cover" />
          ) : (
            <Text style={[styles.glyph, { fontSize: size * 0.5 }]}>{glyph}</Text>
          )}
        </LinearGradient>
      </View>
      {showLabel && label ? (
        <Text style={[styles.label, { color: labelColor, width: size + 26 }]} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 5 },
  tileShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  glyph: { color: '#ffffff' },
  label: {
    fontSize: 11,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default AppIcon;
