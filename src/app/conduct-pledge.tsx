import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLuminaState } from '../context/LuminaContext';
import { RETRO_THEME_ENABLED, RETRO_COLORS, RETRO_FONT, RETRO_GLOW } from '../theme/retro';
import { SynthwaveBackground } from '../components/retro/SynthwaveBackground';
import { NeonCard } from '../components/retro/NeonCard';
import { NeonButton } from '../components/retro/NeonButton';
import { NeonPanel } from '../components/retro/NeonPanel';
import { NeonHeader } from '../components/retro/NeonHeader';

const PLEDGE_TEXT = `I join Lumina to build real friendships — not to impress, perform, or pursue.

I commit to showing up with honesty and care: for my groupmates, for the spaces we share, and for the trust everyone placed in this experience.

I will do the right thing — even when doing the wrong thing is convenient.

I understand that the safety and comfort of every person in my group is my responsibility, too.

I promise to speak up if something feels wrong, and to listen when others do the same.

I represent this community. I will leave every space, every person, and every experience better than I found it.

This is my pledge.`;

export default function ConductPledgeScreen() {
  const router = useRouter();
  const { acceptPledge } = useLuminaState();

  const [initials, setInitials] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedInitials = initials.trim().toUpperCase();
  const canPledge = trimmedInitials.length >= 2 && trimmedInitials.length <= 4;

  const handlePledge = async () => {
    if (!canPledge) {
      setError('Enter 2–4 initials (e.g. "JK" or "JDK").');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await acceptPledge(trimmedInitials);
      router.replace('/onboarding' as any);
    } finally {
      setSaving(false);
    }
  };

  const handleInitialsChange = (val: string) => {
    // Only allow letters and spaces, max 4 chars
    const cleaned = val.replace(/[^a-zA-Z\s]/g, '').slice(0, 4);
    setInitials(cleaned);
    if (error) setError(null);
  };

  if (!RETRO_THEME_ENABLED) {
    return (
      <View className="flex-1 bg-retro-cream">
        <View className="pt-12 pb-3 px-4 bg-retro-cream border-b-2 border-black">
          <Pressable onPress={() => router.back()} className="p-1 -ml-1 mb-2">
            <Ionicons name="chevron-back" size={22} color="#64748B" />
          </Pressable>
          <Text className="font-extrabold text-retro-ink text-xl">Conduct Pledge</Text>
          <Text className="text-retro-dark text-sm mt-1">Step 3 of 3 · Your commitment</Text>
        </View>
        <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="bg-sky-50 border-2 border-black rounded-2xl p-4 mb-5">
            <Text className="font-extrabold text-retro-ink text-base mb-3 text-center">THE LUMINA PLEDGE</Text>
            <Text className="text-retro-ink text-[13px] leading-relaxed">{PLEDGE_TEXT}</Text>
          </View>
          <Text className="text-xs uppercase tracking-widest text-retro-dark mb-2">Enter Your Initials to Affirm</Text>
          <TextInput
            value={initials}
            onChangeText={handleInitialsChange}
            placeholder="e.g. JK"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={4}
            className="bg-white border-2 border-black rounded-xl px-4 py-3 text-xl font-bold text-center w-28 mb-2"
          />
          {error ? <Text className="text-red-500 text-xs mb-3">{error}</Text> : <View className="mb-3" />}
          <Pressable onPress={handlePledge} disabled={!canPledge}
            className={`py-3.5 rounded-xl border-2 items-center mt-2 ${canPledge ? 'bg-retro-blue border-black' : 'bg-gray-200 border-gray-300'}`}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <Text className={`font-bold ${canPledge ? 'text-white' : 'text-gray-400'}`}>I Pledge →</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── Retro synthwave render ──────────────────────────────────────────────────
  return (
    <SynthwaveBackground>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12,
          borderBottomWidth: 1.5, borderBottomColor: RETRO_COLORS.neonMagenta,
          backgroundColor: 'rgba(10,0,32,0.9)',
        }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: 10 }}>
            <Ionicons name="chevron-back" size={22} color={RETRO_COLORS.neonMagenta} />
          </Pressable>
          <NeonHeader title="CONDUCT PLEDGE" subtitle="Step 3 of 3 · Your commitment" />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>
          {/* Pledge heading glyph */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 32,
              borderWidth: 2.5, borderColor: RETRO_COLORS.neonMagenta,
              backgroundColor: 'rgba(30,0,40,0.8)',
              alignItems: 'center', justifyContent: 'center',
              ...RETRO_GLOW.magenta,
            }}>
              <Ionicons name="hand-right-outline" size={34} color={RETRO_COLORS.neonMagenta} />
            </View>
          </View>

          {/* Pledge title */}
          <Text style={{
            color: RETRO_COLORS.neonMagenta, fontSize: 20, fontWeight: '900',
            letterSpacing: RETRO_FONT.letterSpacing, textAlign: 'center',
            textShadowColor: RETRO_COLORS.neonMagenta,
            textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14,
            marginBottom: 20,
          }}>
            THE LUMINA PLEDGE
          </Text>

          {/* Pledge text */}
          <NeonCard variant="magenta" style={{ marginBottom: 20 }}>
            <Text style={{
              color: RETRO_COLORS.textPrimary,
              fontSize: 14, lineHeight: 23,
              fontStyle: 'italic',
            }}>
              {PLEDGE_TEXT}
            </Text>
          </NeonCard>

          {/* Initials input section */}
          <NeonPanel variant="info" style={{ marginBottom: 16 }}>
            <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 12, marginBottom: 12 }}>
              Type your initials below to affirm this pledge. Your initials (and the date) will be recorded with your account.
            </Text>
            <Text style={{
              color: RETRO_COLORS.textMuted, fontSize: 10, fontWeight: '700',
              letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8,
            }}>
              Your Initials (2–4 letters)
            </Text>
            <TextInput
              value={initials}
              onChangeText={handleInitialsChange}
              placeholder="e.g. JK"
              placeholderTextColor={RETRO_COLORS.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={4}
              style={{
                backgroundColor: 'rgba(10,0,32,0.8)',
                borderWidth: 2,
                borderColor: error ? RETRO_COLORS.neonOrange : canPledge ? RETRO_COLORS.neonMagenta : RETRO_COLORS.neonCyan,
                borderRadius: 10,
                paddingHorizontal: 14, paddingVertical: 12,
                color: RETRO_COLORS.neonMagenta,
                fontSize: 22, fontWeight: '900',
                letterSpacing: 6,
                textAlign: 'center',
                width: 120,
                shadowColor: canPledge ? RETRO_COLORS.neonMagenta : 'transparent',
                shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10,
              }}
            />
            {error ? (
              <Text style={{ color: RETRO_COLORS.neonOrange, fontSize: 11, marginTop: 6 }}>{error}</Text>
            ) : null}
          </NeonPanel>
        </ScrollView>

        {/* Footer CTA */}
        <View style={{
          paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12,
          borderTopWidth: 1.5, borderTopColor: RETRO_COLORS.neonMagenta,
          backgroundColor: 'rgba(10,0,32,0.9)',
        }}>
          {saving ? (
            <ActivityIndicator color={RETRO_COLORS.neonMagenta} style={{ padding: 14 }} />
          ) : (
            <NeonButton
              label="I PLEDGE →"
              onPress={handlePledge}
              variant="magenta"
              size="lg"
              fullWidth
              disabled={!canPledge}
            />
          )}
        </View>
      </View>
    </SynthwaveBackground>
  );
}
