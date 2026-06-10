/**
 * GlassPanel — plain translucent "Aero glass" panel.
 *
 * Re-implemented without Skia: the original Skia/shader version crashed the
 * release build at startup (native shader-uniform worklets fire at mount). This
 * uses a simple translucent View, matching the glass look used elsewhere.
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

export interface GlassPanelProps {
  width: number;
  height: number;
  cornerRadius?: number;
  blurRadius?: number;
  opacity?: number;
  borderWidth?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
  enableNoise?: boolean;
  enableChromaticAberration?: boolean;
  chromaticIntensity?: number;
  onPress?: () => void;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  width,
  height,
  cornerRadius = 8,
  borderWidth = 1,
  children,
  style,
}) => (
  <View
    style={[
      styles.panel,
      { width, height, borderRadius: cornerRadius, borderWidth },
      style,
    ]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
});

export default GlassPanel;
