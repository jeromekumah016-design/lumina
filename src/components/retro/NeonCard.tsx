import React from 'react';
import { View, ViewStyle } from 'react-native';
import { RETRO_COLORS, RETRO_GLOW, RETRO_SIZE } from '../../theme/retro';

export type NeonCardVariant = 'magenta' | 'cyan' | 'gold';

export interface NeonCardProps {
  children: React.ReactNode;
  variant?: NeonCardVariant;
  style?: ViewStyle;
}

const VARIANT_MAP: Record<NeonCardVariant, { border: string; glow: object }> = {
  magenta: { border: RETRO_COLORS.neonMagenta, glow: RETRO_GLOW.pink    },
  cyan:    { border: RETRO_COLORS.neonCyan,    glow: RETRO_GLOW.cyan    },
  gold:    { border: RETRO_COLORS.neonYellow,  glow: RETRO_GLOW.yellow  },
};

export function NeonCard({ children, variant = 'magenta', style }: NeonCardProps) {
  const { border, glow } = VARIANT_MAP[variant];
  return (
    <View
      style={[
        {
          backgroundColor: RETRO_COLORS.cardBg,
          borderRadius: RETRO_SIZE.cardBorderRadius,
          borderWidth: 2.5,
          borderColor: border,
          padding: RETRO_SIZE.cardPadding,
          ...glow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default NeonCard;
