import React, { useRef, useEffect } from 'react';
import { Pressable, Animated, Text, View } from 'react-native';
import { RETRO_COLORS, RETRO_GLOW, RETRO_THEME_ENABLED } from '../../theme/retro';

interface Props {
  onPress: () => void;
  visible?: boolean;
}

export function FloatingAssistantButton({ onPress, visible = true }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  if (!visible) return null;

  if (!RETRO_THEME_ENABLED) {
    return (
      <View
        style={{
          position: 'absolute',
          bottom: 90,
          right: 18,
          zIndex: 999,
        }}
      >
        <Pressable
          onPress={onPress}
          style={{
            backgroundColor: '#0284C8',
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 6,
          }}
        >
          <Text style={{ fontSize: 24 }}>💬</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 90,
        right: 18,
        zIndex: 999,
      }}
    >
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable
          onPress={onPress}
          style={{
            backgroundColor: 'rgba(0,0,30,0.95)',
            width: 54,
            height: 54,
            borderRadius: 27,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: RETRO_COLORS.neonCyan,
            ...RETRO_GLOW.cyan,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              color: RETRO_COLORS.neonCyan,
              textShadowColor: RETRO_COLORS.neonCyan,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 10,
            }}
          >
            ✦
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
