/**
 * MenuBar — the macOS top bar:  Apple menu + app name + faux menus on the left,
 * status glyphs + a live clock (tap → notification center) on the right.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MenuBar: React.FC<{
  appName?: string;
  onApple: () => void;
  onClockPress: () => void;
}> = ({ appName = 'NeverSoft', onApple, onClockPress }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const day = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <TouchableOpacity onPress={onApple} hitSlop={8} style={styles.appleBtn}>
          <Text style={styles.apple}></Text>
        </TouchableOpacity>
        <Text style={styles.appName}>{appName}</Text>
        <Text style={styles.menu}>File</Text>
        <Text style={styles.menu}>Edit</Text>
        <Text style={styles.menu}>View</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.statusGlyph}>🔍</Text>
        <Text style={styles.statusGlyph}>🔋</Text>
        <Text style={styles.statusGlyph}>📶</Text>
        <TouchableOpacity onPress={onClockPress} hitSlop={6} style={styles.clockBtn}>
          <Text style={styles.clockDay}>{day}</Text>
          <Text style={styles.clockTime}>{time}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(20,20,24,0.55)',
    zIndex: 50,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  appleBtn: { paddingHorizontal: 2 },
  apple: { color: '#ffffff', fontSize: 15 },
  appName: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  menu: { color: 'rgba(255,255,255,0.92)', fontSize: 13 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  status: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  statusGlyph: { fontSize: 11 },
  clockBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clockDay: { color: '#ffffff', fontSize: 12.5 },
  clockTime: { color: '#ffffff', fontSize: 12.5, fontWeight: '600' },
});

export default MenuBar;
