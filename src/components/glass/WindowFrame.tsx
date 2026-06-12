/**
 * WindowFrame — draggable / resizable window (plain glass, no Skia).
 *
 * Drag (on the title bar) and the corner resize grip use Reanimated +
 * Gesture Handler only — both clamp to the screen. The Skia canvas/shader
 * backgrounds were removed because they crashed the release build at startup.
 */
import React, { useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TASKBAR_CLEARANCE = 48;

export interface WindowFrameProps {
  title: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  children?: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  isMaximized?: boolean;
  isMinimized?: boolean;
  style?: ViewStyle;
  showTitleBar?: boolean;
  titleBarHeight?: number;
  cornerRadius?: number;
  resizable?: boolean;
  draggable?: boolean;
  /** Black cmd.exe-style chrome instead of the blue Aero glass. */
  dark?: boolean;
}

// macOS traffic-light button.
const TrafficLight: React.FC<{ color: string; onPress: () => void }> = ({ color, onPress }) => (
  <TouchableOpacity onPress={onPress} hitSlop={8}>
    <View style={[styles.light, { backgroundColor: color }]} />
  </TouchableOpacity>
);

export const WindowFrame: React.FC<WindowFrameProps> = ({
  title,
  width: initialWidth,
  height: initialHeight,
  x: initialX = 50,
  y: initialY = 50,
  minWidth = 200,
  minHeight = 150,
  maxWidth,
  maxHeight,
  children,
  onClose,
  onMinimize,
  onMaximize,
  onRestore,
  isMaximized = false,
  style,
  showTitleBar = true,
  titleBarHeight = 34,
  cornerRadius = 8,
  draggable = true,
  resizable = true,
  dark = false,
}) => {
  const [windowWidth, setWindowWidth] = useState(initialWidth);
  const [windowHeight, setWindowHeight] = useState(initialHeight);

  const posX = useSharedValue(initialX);
  const posY = useSharedValue(initialY);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: posX.value }, { translateY: posY.value }],
    opacity: opacity.value,
  }));

  const dragGesture = Gesture.Pan()
    .enabled(draggable && !isMaximized)
    .onChange(event => {
      const maxX = SCREEN_W - 64;
      const maxY = SCREEN_H - TASKBAR_CLEARANCE - titleBarHeight;
      posX.value = Math.min(Math.max(posX.value + event.changeX, -(windowWidth - 64)), maxX);
      posY.value = Math.min(Math.max(posY.value + event.changeY, 0), maxY);
    });

  const resizeStart = useRef({ w: initialWidth, h: initialHeight });
  const resizeGesture = Gesture.Pan()
    .enabled(resizable && !isMaximized)
    .runOnJS(true)
    .onStart(() => {
      resizeStart.current = { w: windowWidth, h: windowHeight };
    })
    .onUpdate(event => {
      const capW = maxWidth ?? SCREEN_W;
      const capH = maxHeight ?? SCREEN_H - TASKBAR_CLEARANCE;
      setWindowWidth(Math.min(capW, Math.max(minWidth, resizeStart.current.w + event.translationX)));
      setWindowHeight(Math.min(capH, Math.max(minHeight, resizeStart.current.h + event.translationY)));
    });

  const handleClose = () => {
    const close = onClose ?? (() => {});
    opacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(close)();
    });
  };

  const handleMaximize = () => {
    if (isMaximized) {
      onRestore?.();
    } else {
      onMaximize?.();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        dark && styles.containerDark,
        { width: windowWidth, height: windowHeight, borderRadius: cornerRadius },
        animatedStyle,
        style,
      ]}>
      {showTitleBar && (
        <GestureDetector gesture={dragGesture}>
          <View style={[styles.titleBar, dark && styles.titleBarDark, { height: titleBarHeight }]}>
            <View style={styles.lights}>
              <TrafficLight color="#ff5f57" onPress={handleClose} />
              <TrafficLight color="#febc2e" onPress={onMinimize || (() => {})} />
              <TrafficLight color="#28c840" onPress={handleMaximize} />
            </View>
            <Text
              style={[styles.titleCentered, dark && styles.titleTextDark]}
              numberOfLines={1}
              pointerEvents="none">
              {title}
            </Text>
          </View>
        </GestureDetector>
      )}

      <View style={styles.content}>{children}</View>

      {resizable && !isMaximized && (
        <GestureDetector gesture={resizeGesture}>
          <View style={styles.resizeCorner}>
            <Text style={styles.resizeGlyph}>◢</Text>
          </View>
        </GestureDetector>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  containerDark: {
    backgroundColor: '#0c0c0c',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  titleBarDark: {
    backgroundColor: '#1f1f1f',
    borderBottomColor: '#000000',
  },
  titleTextDark: {
    color: '#e8e8e8',
    fontWeight: '500',
  },
  container: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#f5f5f7',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 10,
    backgroundColor: '#ececee',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.18)',
  },
  lights: { flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 2 },
  light: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.18)',
  },
  titleCentered: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#4a4a4f',
    fontSize: 13,
    fontWeight: '600',
  },
  content: { flex: 1, overflow: 'hidden' },
  resizeCorner: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 4,
  },
  resizeGlyph: { color: 'rgba(120,120,120,0.6)', fontSize: 12 },
});

export default WindowFrame;
