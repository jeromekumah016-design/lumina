import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { RETRO_COLORS, RETRO_FONT } from '../../theme/retro';

export interface NeonHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function NeonHeader({ title, subtitle, style }: NeonHeaderProps) {
  return (
    <View style={style}>
      <Text
        style={{
          color: RETRO_COLORS.neonCyan,
          fontSize: RETRO_FONT.subheaderSize + 4,
          fontWeight: '900',
          letterSpacing: RETRO_FONT.letterSpacing,
          textShadowColor: RETRO_COLORS.neonCyan,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 14,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            color: RETRO_COLORS.textSecondary,
            fontSize: RETRO_FONT.labelSize,
            marginTop: 2,
            letterSpacing: 0.5,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export default NeonHeader;
