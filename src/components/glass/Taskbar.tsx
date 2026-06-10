/**
 * Taskbar — the bottom bar (plain translucent glass, no Skia).
 *
 * Hosts the start orb slot, optional quick-launch / window buttons / system
 * tray, and a tappable clock (opens the notification popup via onClockPress).
 */
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface TaskbarProps {
  height?: number;
  startOrbComponent?: React.ReactNode;
  quickLaunchItems?: React.ReactNode[];
  windowButtons?: React.ReactNode[];
  systemTray?: React.ReactNode;
  onStartPress?: () => void;
  style?: ViewStyle;
  showClock?: boolean;
  clockFormat?: '12h' | '24h';
  /** Tap target for the clock — opens the notification/calendar popup. */
  onClockPress?: () => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  height = 48,
  startOrbComponent,
  quickLaunchItems = [],
  windowButtons = [],
  systemTray,
  style,
  showClock = true,
  clockFormat = '12h',
  onClockPress,
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString(
    'en-US',
    clockFormat === '24h'
      ? { hour12: false, hour: '2-digit', minute: '2-digit' }
      : { hour12: true, hour: 'numeric', minute: '2-digit' },
  );
  const date = now.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={[styles.bar, { height }, style]}>
      <View style={styles.start}>{startOrbComponent}</View>

      {quickLaunchItems.length > 0 && (
        <View style={styles.row}>
          {quickLaunchItems.map((item, i) => (
            <View key={i} style={styles.item}>
              {item}
            </View>
          ))}
        </View>
      )}

      <View style={styles.windowButtons}>
        {windowButtons.map((b, i) => (
          <View key={i}>{b}</View>
        ))}
      </View>

      <View style={styles.tray}>
        {systemTray}
        {showClock && (
          <TouchableOpacity
            style={styles.clock}
            onPress={onClockPress}
            disabled={!onClockPress}
            activeOpacity={0.7}>
            <Text style={styles.time}>{time}</Text>
            <Text style={styles.date}>{date}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    backgroundColor: 'rgba(20,40,70,0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.4)',
  },
  start: { flexDirection: 'row', alignItems: 'center', paddingRight: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  item: { marginHorizontal: 2 },
  windowButtons: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  tray: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.15)',
    paddingLeft: 6,
  },
  clock: { alignItems: 'flex-end', paddingHorizontal: 8 },
  time: { color: 'rgba(255,255,255,0.95)', fontSize: 12, fontWeight: '600' },
  date: { color: 'rgba(255,255,255,0.65)', fontSize: 9 },
});

export default Taskbar;
