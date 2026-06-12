/**
 * NsAvatar — the NeverSoft hooded mascot that sits at the top of the assistant
 * chat. Idle: a slow float/bob. Talking (assistant responding): a livelier
 * bounce + scale pulse, so he reacts while you're talking to him.
 */
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const NS_AVATAR = require('../assets/ns-avatar.jpg');

const NsAvatar: React.FC<{ talking?: boolean; size?: number }> = ({
  talking = false,
  size = 54,
}) => {
  const bob = useSharedValue(0);
  const scale = useSharedValue(1);
  const tilt = useSharedValue(0);

  // Idle float — always running.
  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(3, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [bob]);

  // Talking — quick bounce + slight tilt while the assistant is responding.
  useEffect(() => {
    if (talking) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.09, { duration: 180 }),
          withTiming(0.98, { duration: 180 }),
        ),
        -1,
        true,
      );
      tilt.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 220 }),
          withTiming(4, { duration: 220 }),
        ),
        -1,
        true,
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
      tilt.value = withTiming(0, { duration: 200 });
    }
  }, [talking, scale, tilt]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value },
      { scale: scale.value },
      { rotateZ: `${tilt.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <View style={[styles.ring, { borderRadius: size / 2 }]}>
        <Image source={NS_AVATAR} style={styles.img} resizeMode="contain" />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  ring: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  img: { width: '100%', height: '100%' },
});

export default NsAvatar;
