/**
 * Launchpad — full-screen macOS app grid. Tap an app to launch (and close).
 */
import React, { useState } from 'react';
import {
  ImageSourcePropType,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AppIcon from './AppIcon';
import { APPS, MacApp } from './apps';

const Launchpad: React.FC<{
  visible: boolean;
  onClose: () => void;
  onAppPress: (app: MacApp) => void;
  neverSoftImage?: ImageSourcePropType;
}> = ({ visible, onClose, onAppPress, neverSoftImage }) => {
  const [q, setQ] = useState('');
  const apps = APPS.filter(a => a.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.searchWrap} pointerEvents="box-none">
          <TextInput
            style={styles.search}
            value={q}
            onChangeText={setQ}
            placeholder="Search"
            placeholderTextColor="rgba(255,255,255,0.6)"
            autoCapitalize="none"
          />
        </View>
        <ScrollView contentContainerStyle={styles.grid} keyboardShouldPersistTaps="handled">
          {apps.map(app => (
            <View key={app.id} style={styles.cell}>
              <AppIcon
                glyph={app.glyph}
                colors={app.colors}
                image={app.id === 'neversoft' ? neverSoftImage : undefined}
                size={64}
                showLabel
                label={app.name}
                onPress={() => {
                  onClose();
                  onAppPress(app);
                }}
              />
            </View>
          ))}
        </ScrollView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,12,18,0.82)',
    paddingTop: 70,
  },
  searchWrap: { alignItems: 'center', marginBottom: 24 },
  search: {
    width: 220,
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 14,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 22,
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  cell: { width: 90, alignItems: 'center' },
});

export default Launchpad;
