/**
 * Dock — the macOS bottom dock: a centered, rounded, translucent bar of
 * squircle app icons with a divider before the Trash. Running apps get a dot.
 */
import React from 'react';
import { ImageSourcePropType, StyleSheet, View } from 'react-native';
import AppIcon from './AppIcon';
import { APPS, MacApp } from './apps';

const Dock: React.FC<{
  onAppPress: (app: MacApp) => void;
  running: string[];
  neverSoftImage?: ImageSourcePropType;
}> = ({ onAppPress, running, neverSoftImage }) => {
  const dockApps = APPS.filter(a => a.inDock && a.id !== 'trash');
  const trash = APPS.find(a => a.id === 'trash');

  const renderApp = (app: MacApp) => (
    <View key={app.id} style={styles.slot}>
      <AppIcon
        glyph={app.glyph}
        colors={app.colors}
        image={app.id === 'neversoft' ? neverSoftImage : undefined}
        size={42}
        onPress={() => onAppPress(app)}
      />
      <View style={[styles.dot, running.includes(app.id) ? styles.dotOn : undefined]} />
    </View>
  );

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.dock}>
        {dockApps.map(renderApp)}
        {trash && <View style={styles.divider} />}
        {trash && renderApp(trash)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    alignItems: 'center',
    zIndex: 40,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 4,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  slot: { alignItems: 'center', marginHorizontal: 1.5 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 3, backgroundColor: 'transparent' },
  dotOn: { backgroundColor: 'rgba(255,255,255,0.85)' },
  divider: {
    width: 0.5,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginHorizontal: 5,
  },
});

export default Dock;
