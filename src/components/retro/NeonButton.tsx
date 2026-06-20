import React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';
import { RETRO_COLORS, RETRO_GLOW, RETRO_SIZE } from '../../theme/retro';

export type NeonButtonVariant = 'cyan' | 'magenta' | 'dark';
export type NeonButtonSize = 'sm' | 'md' | 'lg';

export interface NeonButtonProps {
  label: string;
  onPress: () => void;
  variant?: NeonButtonVariant;
  size?: NeonButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const VARIANT_STYLES: Record<NeonButtonVariant, { bg: string; border: string; text: string; glow: object }> = {
  cyan: {
    bg: RETRO_COLORS.keepBg,
    border: RETRO_COLORS.neonCyan,
    text: RETRO_COLORS.neonCyan,
    glow: RETRO_GLOW.cyan,
  },
  magenta: {
    bg: RETRO_COLORS.elimBg,
    border: RETRO_COLORS.neonMagenta,
    text: RETRO_COLORS.neonMagenta,
    glow: RETRO_GLOW.magenta,
  },
  dark: {
    bg: 'rgba(10,0,32,0.9)',
    border: RETRO_COLORS.neonPurple,
    text: RETRO_COLORS.textPrimary,
    glow: RETRO_GLOW.white,
  },
};

const SIZE_STYLES: Record<NeonButtonSize, { py: number; px: number; fs: number }> = {
  sm: { py: 6,  px: 12, fs: 11 },
  md: { py: 10, px: 16, fs: 13 },
  lg: { py: 14, px: 20, fs: 15 },
};

export function NeonButton({
  label,
  onPress,
  variant = 'cyan',
  size = 'md',
  disabled = false,
  fullWidth = false,
  style,
}: NeonButtonProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          backgroundColor: v.bg,
          borderWidth: 2,
          borderColor: v.border,
          borderRadius: RETRO_SIZE.buttonBorderRadius,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          opacity: disabled ? 0.4 : 1,
          alignSelf: fullWidth ? ('stretch' as const) : ('auto' as const),
          ...v.glow,
        },
        style,
      ]}
    >
      <Text style={{ color: v.text, fontWeight: '700', fontSize: s.fs, letterSpacing: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default NeonButton;
