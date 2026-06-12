/**
 * FinderWindow — a clean macOS Finder layout: a Favorites sidebar plus an icon
 * grid of folders. Used for Finder and the media folders.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SIDEBAR = [
  { id: 'airdrop', label: 'AirDrop', glyph: '📡' },
  { id: 'recents', label: 'Recents', glyph: '🕘' },
  { id: 'apps', label: 'Applications', glyph: '🅰️' },
  { id: 'desktop', label: 'Desktop', glyph: '🖥️' },
  { id: 'documents', label: 'Documents', glyph: '📄' },
  { id: 'downloads', label: 'Downloads', glyph: '⬇️' },
];

const FOLDERS: Record<string, { name: string; glyph: string }[]> = {
  Recents: [
    { name: 'Documents', glyph: '📁' },
    { name: 'Downloads', glyph: '📁' },
    { name: 'Pictures', glyph: '🖼️' },
    { name: 'Music', glyph: '🎵' },
    { name: 'Movies', glyph: '🎬' },
    { name: 'notes.txt', glyph: '📄' },
  ],
  Applications: [
    { name: 'Safari', glyph: '🧭' },
    { name: 'Terminal', glyph: '⬛' },
    { name: 'Messages', glyph: '💬' },
    { name: 'Music', glyph: '🎵' },
  ],
};

const FinderWindow: React.FC<{ start?: string }> = ({ start = 'Recents' }) => {
  const [sel, setSel] = useState(start);
  const items = FOLDERS[sel] ?? FOLDERS.Recents;

  return (
    <View style={styles.body}>
      <View style={styles.sidebar}>
        <Text style={styles.sideHead}>Favorites</Text>
        {SIDEBAR.map(s => {
          const active = sel === s.label;
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.sideRow, active && styles.sideRowOn]}
              onPress={() => setSel(s.label)}>
              <Text style={styles.sideGlyph}>{s.glyph}</Text>
              <Text style={[styles.sideLabel, active && styles.sideLabelOn]} numberOfLines={1}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.main}>
        <Text style={styles.crumb}>{sel}</Text>
        <ScrollView contentContainerStyle={styles.grid}>
          {items.map((it, i) => (
            <View key={i} style={styles.item}>
              <Text style={styles.itemGlyph}>{it.glyph}</Text>
              <Text style={styles.itemLabel} numberOfLines={1}>{it.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1, flexDirection: 'row', backgroundColor: '#f4f4f6' },
  sidebar: {
    width: 116,
    backgroundColor: 'rgba(230,230,235,0.95)',
    paddingTop: 8,
    paddingHorizontal: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#d0d0d4',
  },
  sideHead: {
    color: '#8a8a8e',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sideRowOn: { backgroundColor: 'rgba(10,132,255,0.18)' },
  sideGlyph: { fontSize: 13 },
  sideLabel: { color: '#33333a', fontSize: 12.5, flex: 1 },
  sideLabelOn: { color: '#0a84ff', fontWeight: '600' },
  main: { flex: 1, padding: 10 },
  crumb: { color: '#1c1c1e', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  item: { width: 68, alignItems: 'center', gap: 3 },
  itemGlyph: { fontSize: 34 },
  itemLabel: { color: '#1c1c1e', fontSize: 11, textAlign: 'center' },
});

export default FinderWindow;
