import React from 'react';
import { View, ViewStyle } from 'react-native';
import { RETRO_COLORS, RETRO_SIZE } from '../../theme/retro';

export type NeonPanelVariant = 'info' | 'warning' | 'success';

export interface NeonPanelProps {
  children: React.ReactNode;
  variant?: NeonPanelVariant;
  style?: ViewStyle;
}

const VARIANT_MAP: Record<NeonPanelVariant, { border: string; bg: string }> = {
  info:    { border: RETRO_COLORS.neonCyan,    bg: 'rgba(0,20,60,0.55)'  },
  warning: { border: RETRO_COLORS.neonOrange,  bg: 'rgba(40,20,0,0.55)'  },
  success: { border: RETRO_COLORS.neonGreen,   bg: 'rgba(0,50,20,0.55)'  },
};

export function NeonPanel({ children, variant = 'info', style }: NeonPanelProps) {
  const { border, bg } = VARIANT_MAP[variant];
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderWidth: 1.5,
          borderColor: border,
          borderRadius: RETRO_SIZE.cardBorderRadius,
          padding: 14,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default NeonPanel;
